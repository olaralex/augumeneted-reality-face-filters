# IARA AR Element Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A browser-first Expo (React Native) app that opens the selfie camera, tracks face + hands with MediaPipe, paints them with an animated element skin (fire / ice / earth / water) and lets the user take a photo or video and save it.

**Architecture:** Expo SDK 58 app exported as a static web site (`expo export -p web`). UI (top bar, dock, capture button, preview sheet, overlays) is React Native components rendered by react-native-web. The AR engine is web-only code behind one component, `src/ar/ArStage.web.tsx`: a hidden `<video>` (getUserMedia) feeds MediaPipe Tasks Vision; one Three.js `<canvas>` draws the mirrored video plus face mesh, hand glove and eye glow with procedural GLSL shaders. Photos/videos are captured from that canvas, so they contain the effect.

**Tech Stack:** Expo SDK 58 (`blank-typescript` template), TypeScript, react-native-web, `@mediapipe/tasks-vision@1.1.1`, `three@0.186.1` + `@types/three@0.186`, `@expo-google-fonts/inter`, jest-expo, `selfsigned` (dev), Node 24 / npm 10 on Windows.

**Spec:** `docs/superpowers/specs/2026-11-08-iara-ar-filters-design.md`

## Global Constraints

- Web only. No native modules, no Expo Router, no native stub for `ArStage`.
- Exact versions: `@mediapipe/tasks-vision@1.1.1`, `three@0.186.1` (newer releases are < 2 weeks old). Expo packages: let `npx expo install` choose.
- Front camera only; preview mirrored; saved photo/video mirrored the same way.
- Element order and accents: fire `#ff6a2b`, ice `#7dd3fc`, earth `#a3794a`, water `#2563eb`. Fire active at startup; tapping the active element turns the filter off.
- Theme: bg `#0a0a0b`, line `#232326`, text `#ededef`, muted `#8a8a93`, font Inter.
- Tap vs hold threshold 300 ms. Max video 30 s. No audio (never request microphone).
- Coverage: face mesh (forehead–chin) + hands only. Eyes and inner mouth never covered.
- Save: iOS → `navigator.share({files})` triggered directly by the "Salvează" tap; everything else → `<a download>`.
- Performance cuts, in order: hands every 2nd frame → lower render pixel ratio → lower shader detail. Face detected every frame. Target ≥ 24 fps on iPhone 13.
- MediaPipe delegate `GPU`, fall back to `CPU` if creation throws.
- Models and WASM served from the site itself (`public/`), never a CDN; fetched by relative URL so the site works under a `/<repo>/` subpath.
- UI copy is Romanian, all of it in `src/copy.ts`.

## Review Focus

1. **iOS share loses the user gesture** — if `navigator.share` runs after an `await`, Safari rejects it. The `File` is built when the preview opens; the tap calls `share` synchronously. → Task 2 `save.test.ts › calls share synchronously`.
2. **Camera blocked or missing** — denied permission / no camera must show the "blocked" overlay with retry, never a black screen. → Task 4 `cameraError.test.ts`.
3. **Face leaves frame and comes back** — mask must disappear (not freeze), and must not ease in from the old position. → Task 3 `smoothing.test.ts › reset on null`.
4. **0, 1 or 2 hands, hands crossing** — glove geometry must handle every count with no stale triangles. → Task 3 `handMesh.test.ts`.
5. **Phone locked / tab hidden while recording** — iOS stops camera tracks; recording must stop and still produce a playable file. → Task 7 step 5 (manual: lock iPhone mid-recording, unlock, preview shows the clip so far).

---

### Task 1: Scaffold Expo web app, theme, assets, test setup

**Files:**
- Create (template): `package.json`, `app.json`, `tsconfig.json`, `index.ts`, `App.tsx`
- Create: `.gitignore`, `src/theme.ts`, `src/copy.ts`, `src/ui/TopBar.tsx`, `scripts/fetch-assets.mjs`, `scripts/gen-face-mesh.mjs` (body in Task 3), `src/__tests__/theme.test.ts`

**Interfaces:**
- Produces: `type ElementId = 'fire' | 'ice' | 'earth' | 'water'`; `ELEMENTS: readonly { id: ElementId; label: string; emoji: string; accent: string }[]` (order fire, ice, earth, water); `colors: { bg; line; text; muted; panel: '#111113' }`; `copy` (object of strings, filled in later tasks); `<TopBar recording: boolean />`; static files `public/models/face_landmarker.task`, `public/models/hand_landmarker.task`, `public/wasm/*`.

- [ ] **Step 1:** In `D:\IARA` (already contains `docs/`, `.superpowers/`) run `npx create-expo-app@latest iara-tmp --template blank-typescript@sdk-58`, move its contents to the repo root, delete `iara-tmp`. Then `npx expo install react-dom react-native-web @expo/metro-runtime @expo-google-fonts/inter expo-font` and `npm i -E @mediapipe/tasks-vision@1.1.1 three@0.186.1` and `npm i -D -E @types/three@0.186.1 jest-expo jest @types/jest selfsigned`.
- [ ] **Step 2:** `git init`; `.gitignore` = template defaults + `.superpowers/`, `public/models/`, `public/wasm/`, `dist/`, `.cert/`.
- [ ] **Step 3:** `app.json`: name `IARA`, `web.output: "single"`, `web.bundler: "metro"`, `userInterfaceStyle: "dark"`. `package.json` scripts: `"web": "expo start --web"`, `"export": "expo export -p web"`, `"test": "jest"`, `"postinstall": "node scripts/fetch-assets.mjs"`; `"jest": { "preset": "jest-expo/web" }`.
- [ ] **Step 4:** `scripts/fetch-assets.mjs`: copy `node_modules/@mediapipe/tasks-vision/wasm/*` → `public/wasm/`; download if missing `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task` and `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task` into `public/models/` (use `fetch`, fail with non-zero exit on non-200). Run `npm run postinstall`; expected: both `.task` files exist, each > 1 MB.
- [ ] **Step 5:** Failing test `src/__tests__/theme.test.ts`:
  ```ts
  expect(ELEMENTS.map(e => e.id)).toEqual(['fire','ice','earth','water']);
  expect(ELEMENTS.map(e => e.accent)).toEqual(['#ff6a2b','#7dd3fc','#a3794a','#2563eb']);
  expect(ELEMENTS.map(e => e.label)).toEqual(['Foc','Gheață','Pământ','Apă']);
  ```
  Run `npx jest src/__tests__/theme.test.ts` → FAIL (module not found).
- [ ] **Step 6:** Implement `src/theme.ts` (emojis 🔥 ❄️ 🌍 💧), `src/copy.ts` (empty object for now), `TopBar` (44 px, `colors.bg` at 70 % opacity, 1 px bottom `colors.line`, 6 px accent dot `#5e6ad2` + "IARA" Inter 500 13 px; right side red dot + "REC" only when `recording`). `App.tsx`: load Inter 400/500, full-screen `colors.bg` view with `TopBar`. Run test → PASS.
- [ ] **Step 7:** `npm run export` → expected `dist/index.html` exists and `dist/models/`, `dist/wasm/` copied from `public/`.
- [ ] **Step 8:** Commit `chore: scaffold Expo web app with theme and MediaPipe assets`.

### Task 2: Capture logic (pure)

**Files:**
- Create: `src/capture/pressGesture.ts`, `src/capture/mime.ts`, `src/capture/save.ts`
- Test: `src/capture/__tests__/pressGesture.test.ts`, `mime.test.ts`, `save.test.ts`

**Interfaces:**
- Produces:
  - `HOLD_MS = 300`, `MAX_RECORD_MS = 30_000`
  - `createPressGesture(cb: { onTap(): void; onHoldStart(): void; onHoldEnd(): void }, setTimer = setTimeout, clearTimer = clearTimeout): { pressIn(): void; pressOut(): void }`
  - `pickMimeType(isSupported: (t: string) => boolean): { mimeType: string; ext: 'mp4' | 'webm' } | null` — tries in order `video/mp4;codecs=avc1`, `video/mp4`, `video/webm;codecs=vp9`, `video/webm`
  - `isIOS(nav: { userAgent: string; platform: string; maxTouchPoints: number }): boolean` (iPhone/iPad/iPod, or `MacIntel` with `maxTouchPoints > 1`)
  - `captureFileName(element: ElementId | null, ext: string, d: Date): string` → `iara-fire-20261108-143005.png`; `null` → `iara-camera-…`
  - `saveCapture(file: File, env: { ios: boolean; share?: (d: { files: File[] }) => Promise<void>; canShare?: (d: { files: File[] }) => boolean; download: (f: File) => void }): Promise<'shared' | 'downloaded' | 'cancelled'>`

- [ ] **Step 1: Write failing tests**
  - pressGesture (jest fake timers): pressIn → pressOut after 100 ms ⇒ `onTap` once, no hold calls; pressIn → advance 300 ms ⇒ `onHoldStart` once; pressOut ⇒ `onHoldEnd` once, no `onTap`.
  - mime: supports only `video/webm` ⇒ `{mimeType:'video/webm', ext:'webm'}`; supports all ⇒ `video/mp4;codecs=avc1`/`mp4`; supports none ⇒ `null`.
  - save: ios + canShare true ⇒ `'shared'`, download not called; non-ios ⇒ `'downloaded'`, share not called; share rejects `{name:'AbortError'}` ⇒ `'cancelled'`; share rejects other error ⇒ download called, `'downloaded'`; **`calls share synchronously`**: call `saveCapture(...)` without awaiting, then on the very next line `expect(share).toHaveBeenCalled()`.
  - `captureFileName('fire','png', new Date(2026,10,8,14,30,5))` ⇒ `'iara-fire-20261108-143005.png'`.
- [ ] **Step 2:** `npx jest src/capture` → FAIL.
- [ ] **Step 3:** Implement the three modules per the signatures. `saveCapture` must call `share` before its first `await`.
- [ ] **Step 4:** `npx jest src/capture` → PASS.
- [ ] **Step 5:** Commit `feat: capture gesture, mime selection and save logic`.

### Task 3: Tracking geometry (pure): face mesh data, smoothing, hand glove, perf governor

**Files:**
- Create: `scripts/gen-face-mesh.mjs`, `src/ar/faceMeshData.ts` (generated, committed), `src/ar/smoothing.ts`, `src/ar/handMesh.ts`, `src/ar/governor.ts`
- Test: `src/ar/__tests__/faceMeshData.test.ts`, `smoothing.test.ts`, `handMesh.test.ts`, `governor.test.ts`

**Interfaces:**
- Produces:
  - `FACE_UVS: Float32Array` (468×2), `FACE_INDICES: Uint16Array` (triangles over vertices 0–467), `FACE_EDGE: Float32Array` (468; `0` on face-oval vertices, `1` elsewhere — used for alpha fade)
  - `type P3 = { x: number; y: number; z: number }` (normalized MediaPipe landmark)
  - `createSmoother(alpha = 0.6): { next(points: P3[] | null): P3[] | null }` (EMA; `null` resets state)
  - `buildHandGeometry(hands: P3[][]): { positions: Float32Array; uvs: Float32Array; indices: Uint32Array }` (positions `x, y, 0` in normalized image space)
  - `createGovernor(): { tick(frameMs: number): { detectHandsThisFrame: boolean; pixelRatio: number; detail: 0 | 1 | 2 } }`

- [ ] **Step 1:** `scripts/gen-face-mesh.mjs`: download `https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/modules/face_geometry/data/canonical_face_model.obj`, parse `vt` and `f` lines (OBJ indices are 1-based `v/vt`; vertex index == uv index), drop any triangle whose 3 vertices are all in one of these rings — left eye `[33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246]`, right eye `[263,249,390,373,374,380,381,382,362,398,384,385,386,387,388,466]`, inner lips `[78,95,88,178,87,14,317,402,318,324,308,191,80,81,82,13,312,311,310,415]` — and write `src/ar/faceMeshData.ts`. `FACE_EDGE` = 0 for vertices in `FaceLandmarker.FACE_LANDMARKS_FACE_OVAL` (start/end of each connection; copy the list as a literal in the script). Flip UV v (`1 - v`) so the texture is upright.
- [ ] **Step 2: Write failing tests**
  - faceMeshData: `FACE_UVS.length === 936`; all uvs in [0,1]; `FACE_INDICES.length % 3 === 0`; max index < 468; > 800 triangles; no triangle with all 3 vertices in the inner-lip ring or in either eye ring.
  - **smoothing `reset on null`**: `next(A)` ⇒ A; `next(B)` ⇒ `0.6*B + 0.4*A`; `next(null)` ⇒ null; `next(C)` ⇒ exactly C.
  - **handMesh**: `[]` ⇒ all arrays empty; one synthetic 21-point hand ⇒ `indices.length > 0`, `% 3 === 0`, every index < `positions.length / 3`; two hands ⇒ vertex count exactly 2× one hand. Use fixture `src/ar/__tests__/fixtures/hand.ts` (21 points of an open palm).
  - governor: 30 ticks of 20 ms ⇒ hands every frame, pixelRatio 1, detail 2; 30 ticks of 50 ms ⇒ hands alternate true/false; after 60 more 50 ms ticks ⇒ pixelRatio 0.75; after 60 more ⇒ detail 1; recovering to 20 ms for 120 ticks restores levels in reverse order.
- [ ] **Step 3:** `npx jest src/ar` → FAIL.
- [ ] **Step 4:** Run `node scripts/gen-face-mesh.mjs`; implement `smoothing.ts`, `governor.ts`, `handMesh.ts`.
  - Governor: EMA of `frameMs`; budget = 1000/24 ms; over budget for 30 consecutive ticks ⇒ step one level down (hands-alternate → pixelRatio 0.75 → detail 1 → detail 0); under 0.8× budget for 120 ticks ⇒ step one level up.
  - Hand glove: for each of the 20 `HAND_CONNECTIONS` bones a quad of half-width `w = 0.18 * |p0 − p9|`; at each of the 21 joints a 12-segment disc of radius `w`; palm = triangle fan over `[0,1,5,9,13,17]`. UV = position × 8 so the shader pattern has stable scale.
- [ ] **Step 5:** `npx jest src/ar` → PASS.
- [ ] **Step 6:** Commit `feat: face mesh data, landmark smoothing, hand glove geometry, perf governor`.

### Task 4: AR stage — camera, tracking, mirrored video, debug face mesh

**Files:**
- Create: `src/ar/cameraError.ts`, `src/ar/tracker.ts`, `src/ar/scene.ts`, `src/ar/ArStage.web.tsx`
- Test: `src/ar/__tests__/cameraError.test.ts`
- Modify: `App.tsx`, `src/copy.ts`

**Interfaces:**
- Consumes: Task 3 exports; `ElementId`.
- Produces:
  - `type ArStatus = 'loading' | 'ready' | 'denied' | 'no-camera' | 'error'`
  - `cameraErrorToStatus(err: unknown): ArStatus` — `NotAllowedError`/`SecurityError` ⇒ `'denied'`; `NotFoundError`/`OverconstrainedError` ⇒ `'no-camera'`; else `'error'`
  - `createTracker(): Promise<{ detect(video: HTMLVideoElement, tMs: number, hands: boolean): { face: P3[] | null; hands: P3[][] } }>` — `FilesetResolver.forVisionTasks(new URL('wasm', document.baseURI).href)`; `FaceLandmarker` (`numFaces: 1`, `runningMode: 'VIDEO'`), `HandLandmarker` (`numHands: 2`); model paths `new URL('models/<name>.task', document.baseURI).href`; `delegate: 'GPU'`, retry with `'CPU'` if creation throws. When `hands` is false, return the previous hand result.
  - `createScene(canvas: HTMLCanvasElement, video: HTMLVideoElement): { update(face: P3[] | null, hands: P3[][], tSec: number): void; setElement(id: ElementId | null): void; setPixelRatio(r: number): void; setDetail(d: 0|1|2): void; render(): void; dispose(): void }`
  - `<ArStage element: ElementId | null; onStatus(s: ArStatus): void; onFaceVisible(v: boolean): void; retryKey: number; ref: ArStageHandle />` (`ArStageHandle` defined in Task 7)

- [ ] **Step 1:** Failing `cameraError.test.ts`: one case per mapping above, using `{ name: 'NotAllowedError' }` etc., and `new Error('x')` ⇒ `'error'`. Run → FAIL. Implement. Run → PASS.
- [ ] **Step 2:** Implement `tracker.ts` per the interface.
- [ ] **Step 3:** Implement `scene.ts`: `WebGLRenderer({ canvas, preserveDrawingBuffer: true, antialias: true })`; `OrthographicCamera(1, 0, 0, 1, -10, 10)` (left=1/right=0 mirrors x; top=0/bottom=1 matches MediaPipe y-down); full 1×1 `VideoTexture` plane at z=-1; face `BufferGeometry` with `position` (468×3, updated each frame from landmarks), `uv` = `FACE_UVS`, `aEdge` = `FACE_EDGE`, index = `FACE_INDICES`; hand mesh rebuilt from `buildHandGeometry`. All materials `side: DoubleSide` (mirrored camera flips winding), `transparent: true`, `depthTest: false`. For this task the face uses a flat `MeshBasicMaterial({ color: 0xff00ff, wireframe: true })`. Canvas size = video intrinsic size, checked every frame (iOS swaps `videoWidth/Height` on rotation).
- [ ] **Step 4:** Implement `ArStage.web.tsx`: renders `<video playsInline muted autoPlay style={{display:'none'}}>` and a `<canvas>` styled `position:absolute; inset:0; width:100%; height:100%; object-fit:cover`. On mount and whenever `retryKey` changes: `getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })` (errors → `cameraErrorToStatus` → `onStatus`), then `createTracker()` (status `'loading'` until resolved), then a `requestAnimationFrame` loop: `governor.tick` → `tracker.detect` (face every frame, hands per governor) → `smoother.next` → `scene.update`/`render`; `onFaceVisible` only on change. On unmount stop tracks, dispose scene.
- [ ] **Step 5:** `App.tsx`: render `<ArStage>` full-screen under `TopBar`; show a temporary status text.
- [ ] **Step 6: Manual check** (`npm run web`, http://localhost:8081, laptop Chrome): camera prompt → mirrored video; magenta wireframe sticks to the face, follows blink and mouth opening, no mesh over eyes or inside the mouth; covering the camera hides the mesh; denying permission shows status `denied`.
- [ ] **Step 7:** Commit `feat: AR stage with MediaPipe face/hand tracking and mirrored render`.

### Task 5: Element skins — shaders, eye glow, hand glove

**Files:**
- Create: `src/ar/shaders/common.ts`, `fire.ts`, `ice.ts`, `earth.ts`, `water.ts`, `src/ar/materials.ts`
- Modify: `src/ar/scene.ts`

**Interfaces:**
- Consumes: `createScene` (Task 4).
- Produces: `createElementMaterial(id: ElementId): THREE.ShaderMaterial` with uniforms `uTime: float`, `uDetail: float` (0–2), `uAccent: vec3`. `scene.setElement` swaps face + hand materials and glow color; `null` hides all effect meshes.

- [ ] **Step 1:** `common.ts`: vertex shader passing `vUv`, `vEdge` (hand mesh has no `aEdge` → default attribute value 1); GLSL helpers: 2D value noise, fbm (octaves = `2 + uDetail`), Voronoi edge distance. Every fragment multiplies alpha by `smoothstep(0.0, 0.35, vEdge)` so the mask fades into real skin at the face border.
- [ ] **Step 2:** Four fragment shaders matching spec §2:
  - **fire**: dark basalt base `#2b1410`; Voronoi cracks glow `uAccent`→`#ffd36b` at crack center; glow pulses `0.75 + 0.25*sin(uTime*3 + fbm)`.
  - **ice**: translucent `#bfe6ff` base (alpha 0.85) with fresnel-like rim brightening toward `vEdge→0`; white frost cracks from thin Voronoi edges; slow shimmer.
  - **earth**: stone/clay `#6b4f36` with fbm light/dark mottling; wide Voronoi cracks dark with `#4f7a3a` moss inside; no animation except subtle dust shimmer.
  - **water**: translucent `#1e5bd8` (alpha 0.75); flowing ripples via fbm with `uv.y + uTime*0.15`; specular streaks `#e8f4ff` where ripple gradient peaks.
- [ ] **Step 3:** Eye glow in `scene.ts`: two additive-blended sprites at iris landmarks 468 and 473, radial-gradient texture generated once on a 64×64 canvas, tinted by element accent, size 0.06 × face width; opacity scaled by eye openness `|p159−p145| / |p33−p133|` (right: 386/374 over 263/362) mapped 0.1→0, 0.25→1, so glow dims when blinking.
- [ ] **Step 4:** Apply the same element material (separate instance) to the hand mesh. Wire `scene.setDetail` from the governor's `detail`.
- [ ] **Step 5: Manual check** (laptop Chrome, switch elements via a temporary keyboard handler 1–4/0 in `ArStage.web.tsx`, removed in Task 6): each skin matches its spec §2 description; face border fades softly; eyes and open mouth stay real; eyes glow and dim on blink; both hands get the glove, which follows the fingers.
- [ ] **Step 6:** Commit `feat: procedural fire/ice/earth/water skins with eye glow and hand glove`.

### Task 6: Dashboard UI — dock, overlays, element selection

**Files:**
- Create: `src/ui/Dock.tsx`, `src/ui/StatusOverlay.tsx`, `src/ui/useElementSelection.ts`
- Test: `src/ui/__tests__/useElementSelection.test.ts`
- Modify: `App.tsx`, `src/copy.ts`, `src/ar/ArStage.web.tsx` (remove temp keys)

**Interfaces:**
- Produces: `toggleElement(current: ElementId | null, tapped: ElementId): ElementId | null`; `INITIAL_ELEMENT: ElementId = 'fire'`; `<Dock active: ElementId | null; onSelect(id: ElementId): void; children?: ReactNode />` (children = capture button slot, placed above the dock); `<StatusOverlay status: ArStatus; faceVisible: boolean; onRetry(): void />`.
- `copy` additions: `loading: 'Se încarcă modelele…'`, `deniedTitle: 'Accesul la cameră e blocat'`, `deniedBody: 'Permite camera din setările browserului, apoi reîncearcă.'`, `noCamera: 'Nu am găsit nicio cameră.'`, `error: 'Ceva n-a mers. Reîncearcă.'`, `retry: 'Reîncearcă'`, `noFace: 'Încadrează-ți fața'`.

- [ ] **Step 1:** Failing test: `toggleElement('fire','fire') === null`; `toggleElement('fire','ice') === 'ice'`; `toggleElement(null,'water') === 'water'`; `INITIAL_ELEMENT === 'fire'`. Run → FAIL. Implement. Run → PASS.
- [ ] **Step 2:** `Dock` (layout A): floating pill centered 24 px above bottom safe area, bg `#0f0f12` 80 % opacity, 1 px `colors.line` border, radius 999, 6 px padding. Width `useWindowDimensions().width >= 640` ⇒ each element a pill with emoji + label (Inter 500 13 px); below ⇒ 40 px circle filled with the accent. Active: 1.5 px accent border + accent-tinted text. Each is a `Pressable` with `accessibilityRole="button"`, `accessibilityLabel={label}`, `accessibilityState={{selected}}`.
- [ ] **Step 3:** `StatusOverlay`: `loading` ⇒ centered muted text; `denied`/`no-camera`/`error` ⇒ centered `colors.panel` card, 1 px line border, radius 12, title + body + retry button (increments `retryKey` in `App`); `ready && !faceVisible` ⇒ small muted hint pill near the top.
- [ ] **Step 4:** `App.tsx`: wire element state (`INITIAL_ELEMENT`), status, faceVisible, retryKey. Capture slot empty for now.
- [ ] **Step 5: Manual check** at desktop width and at 390 px wide (browser device toolbar): matches mockup A; tapping switches skin; tapping the active one turns the filter off.
- [ ] **Step 6:** Commit `feat: minimal dock UI, status overlays and element selection`.

### Task 7: Photo & video capture, preview, save

**Files:**
- Create: `src/ar/recorder.ts`, `src/ui/CaptureButton.tsx`, `src/ui/PreviewSheet.tsx`
- Modify: `src/ar/ArStage.web.tsx`, `App.tsx`, `src/copy.ts`

**Interfaces:**
- Consumes: Task 2 (`createPressGesture`, `pickMimeType`, `captureFileName`, `saveCapture`, `isIOS`, `MAX_RECORD_MS`).
- Produces:
  - `ArStageHandle = { takePhoto(): Promise<Blob>; startRecording(): void; stopRecording(): Promise<Blob | null> }` (exposed via `forwardRef` + `useImperativeHandle`)
  - `createRecorder(canvas: HTMLCanvasElement): { start(): void; stop(): Promise<Blob | null>; readonly ext: 'mp4' | 'webm' | null }` — `canvas.captureStream(30)`, `MediaRecorder` with `pickMimeType(MediaRecorder.isTypeSupported)`, auto-stop at `MAX_RECORD_MS`
  - `<CaptureButton onPhoto(): void; onRecordStart(): void; onRecordStop(): void; recording: boolean />`
  - `<PreviewSheet file: File; kind: 'photo' | 'video'; onSave(): void; onDiscard(): void />`
- `copy` additions: `save: 'Salvează'`, `discard: 'Renunță'`, `saved: 'Salvat'`, `capture: 'Fă o poză, ține apăsat pentru video'` (accessibility label).

- [ ] **Step 1:** `recorder.ts` per interface. If `pickMimeType` returns null, `start()` throws and the UI hides hold-to-record (tap still takes photos). `takePhoto` = render one frame, then `canvas.toBlob(cb, 'image/png')`.
- [ ] **Step 2:** `CaptureButton`: 64 px circle, 3 px `#ededef` ring, white inner circle → red rounded square while recording; a progress bar under the button fills over 30 s while recording. Driven by `createPressGesture` via `onPressIn`/`onPressOut`. Placed in the `Dock` children slot.
- [ ] **Step 3:** `PreviewSheet`: full-screen dim backdrop (`#0a0a0bcc`), centered media card (`<img>` / `<video controls playsInline autoPlay loop muted>` from `URL.createObjectURL(file)`, revoked on unmount), two buttons below: "Renunță" (ghost) and "Salvează" (filled `#ededef`, dark text). The `File` is created when capture finishes, before the sheet opens. `onSave` calls `saveCapture(file, env)` synchronously from the press handler with `env.ios = isIOS(navigator)`, `env.share = navigator.share?.bind(navigator)`, `env.canShare = navigator.canShare?.bind(navigator)`, `env.download` = temporary `<a download>` click. On `'shared'`/`'downloaded'` show "Salvat" for 1.2 s then close; on `'cancelled'` keep the sheet open.
- [ ] **Step 4:** Wire in `App.tsx`: `recording` → `TopBar`; element switching disabled while recording. In `ArStage`: on `document.visibilitychange` → hidden while recording ⇒ `stopRecording()` and open preview with what was captured.
- [ ] **Step 5: Manual check** (laptop): tap ⇒ preview ⇒ Salvează downloads `iara-fire-YYYYMMDD-HHmmss.png` containing the mirrored skin; hold ⇒ REC shows, release ⇒ preview ⇒ Salvează downloads `.webm`/`.mp4` that plays; recording auto-stops at 30 s; switching tab while recording stops it and opens the preview.
- [ ] **Step 6:** Commit `feat: photo and video capture with preview and save`.

### Task 8: Local-network HTTPS for phone testing + README

**Files:**
- Create: `scripts/serve-https.mjs`, `README.md`
- Modify: `package.json`

**Interfaces:**
- Produces: `npm run phone` = `expo export -p web && node scripts/serve-https.mjs`.

- [ ] **Step 1:** `scripts/serve-https.mjs`: generate a self-signed cert with `selfsigned` (CN `iara.local`, 365 days), cached in `.cert/`; serve `dist/` with `node:https` on port 8443 with correct content types for `.wasm` (`application/wasm`), `.task`, `.js`, `.css`, `.png`, `.html`, falling back to `index.html`; print `https://<LAN-IPv4>:8443` for each non-internal IPv4 from `os.networkInterfaces()`.
- [ ] **Step 2:** `npm run phone` → expected: URL printed; opening `https://localhost:8443` on the laptop (accept warning) works the same as dev.
- [ ] **Step 3:** `README.md` (Romanian): `npm install`, `npm run web` (laptop), `npm run phone` (phone on same Wi-Fi: open printed URL, accept the certificate warning once), `npm test`; note that GitHub Pages deploy comes later (set `experiments.baseUrl` to `/<repo>` in `app.json`).
- [ ] **Step 4: Manual check on the user's iPhone (Safari + Chrome) and the friend's Android Chrome:** camera, all 4 skins, glove; fps feels fluid; photo → Salvează → share sheet → "Save Image" lands in Photos; video → Salvează → "Save Video" lands in Photos; Android: download appears in Files/Gallery; lock phone mid-recording → preview shows partial clip.
- [ ] **Step 5:** `npx jest` → all pass. Commit `chore: local HTTPS server for phone testing and README`.
