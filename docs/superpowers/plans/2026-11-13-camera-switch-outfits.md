# Schimbare cameră și outfituri Y2K: plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Buton de schimbare a camerei (frontală ↔ spate) și 10 outfituri Y2K desenate cartoonish pe persoana cea mai apropiată, în aceeași listă cu filtrele.

**Architecture:** `PoseLandmarker` (deja în `@mediapipe/tasks-vision`) dă 33 de puncte ale corpului. O funcție pură transformă punctele și descrierea outfitului în forme 2D. Un desenator Canvas2D le desenează cu contur gros și hașuri pe un canvas de mărimea video-ului. Canvasul e o `CanvasTexture` pe un plan în scena Three.js existentă, așa că oglindirea, poza și video-ul merg automat. Camera se schimbă repornind doar fluxul video, fără să se reîncarce modelele.

**Tech Stack:** Expo / React Native Web, TypeScript, Three.js 0.186.1, @mediapipe/tasks-vision 1.1.1, Jest (jest-expo/web).

**Spec:** `docs/superpowers/specs/2026-11-13-camera-switch-outfits-design.md`

## Global Constraints

- **Fără commit și fără push.** Utilizatorul a cerut asta explicit. Niciun task nu face `git commit`.
- Nu se adaugă dependențe noi.
- Tot textul din interfață e în română și stă în `src/copy.ts`.
- ≥ 24 fps pe un telefon de 2–3 ani (iPhone Safari/Chrome, Android Chrome).
- E activă o singură opțiune odată: element sau outfit. Apăsarea pe opțiunea activă o oprește. La pornire e activ Foc.
- În modul outfit rulează doar Pose. În modul element (sau fără opțiune) rulează fața și mâinile, ca acum.
- Modelul de corp e `pose_landmarker_lite`. Se încarcă la prima alegere a unui outfit, nu la pornire.
- `numPoses: 2`. „Cea mai apropiată” persoană e cea cu distanța cea mai mare între umeri.
- Camera frontală e oglindită, camera din spate nu.
- Când se găsește o singură cameră, butonul de schimbare e ascuns. Cât timp se înregistrează, e blocat.
- Stilul: contur negru gros, culori plate, umbră în trepte, hașuri. Fără personaje, logouri sau haine din jocul Borderlands.

## Review Focus

1. **Persoana iese parțial din cadru** (șoldurile apar și dispar la marginea de jos). Pantalonii nu trebuie să clipească, adică e nevoie de histerezis. Testat în Task 2.
2. **Nimeni în cadru în modul outfit.** Nu rămâne niciun outfit „înghețat” pe ecran și apare mesajul „Încadrează-te în cadru”. Testat în Task 3 (pose `null` → zero forme). Vizibilitatea se verifică manual în Task 8.
3. **Persoana stă din profil** (umerii aproape suprapuși). Nu apar forme cu `NaN` și nici forme cu grosimea zero. Testat în Task 3.
4. **Schimbarea camerei eșuează** (fără permisiune pentru camera din spate, sau iOS refuză al doilea flux). Apare cartonașul de eroare cu „Reîncearcă”, nu un ecran negru. Vechiul flux e oprit înainte să se ceară cel nou. Verificat manual în Task 8.
5. **Modelul de corp nu se poate descărca** (rețea slabă). Apare cartonașul de eroare. „Reîncearcă” pornește din nou camera cu opțiunea rămasă activă. Verificat manual în Task 8.

---

### Task 1: Modelul de opțiuni (elemente + outfituri)

**Files:**
- Modify: `src/theme.ts`
- Modify: `src/ui/useElementSelection.ts`
- Modify: `src/capture/save.ts:7`
- Test: `src/__tests__/theme.test.ts`, `src/ui/__tests__/useElementSelection.test.ts`, `src/capture/__tests__/save.test.ts`

**Interfaces:**
- Produces, în `src/theme.ts`:
  - `export type OutfitId = 'velour' | 'butterfly' | 'satin' | 'rock' | 'mesh' | 'flames' | 'tracksuit' | 'hoodie' | 'bball' | 'bowling'`
  - `export type OptionId = ElementId | OutfitId`
  - `export type OutfitGroup = 'women' | 'men'`
  - `export const OUTFITS: readonly { id: OutfitId; label: string; emoji: string; accent: string; group: OutfitGroup }[]`
  - `export const isOutfit = (id: OptionId | null): id is OutfitId`
  - `export const GROUP_LABELS: Record<'elements' | OutfitGroup, string> = { elements: 'Elemente', women: 'Femei', men: 'Bărbați' }`
- Produces, în `src/ui/useElementSelection.ts`: `toggleElement(current: OptionId | null, tapped: OptionId): OptionId | null`. `INITIAL_ELEMENT` rămâne `'fire'`.
- Produces, în `src/capture/save.ts`: `captureFileName(option: OptionId | null, ext: string, d: Date): string`. Formatul rămâne neschimbat.

Datele pentru `OUTFITS`, în ordine. Etichetele vin din spec. Emoji și accentele sunt alese de mine.

| id | label | emoji | accent | group |
|---|---|---|---|---|
| velour | Trening de catifea | 👚 | #f472b6 | women |
| butterfly | Baby tee cu fluture | 🦋 | #c084fc | women |
| satin | Satin și denim | ✨ | #e9d5b7 | women |
| rock | Rock | 🎸 | #ef4444 | women |
| mesh | Bandană și plasă | 🕸️ | #a3a3a3 | women |
| flames | Flăcări | 🔥 | #f97316 | men |
| tracksuit | Trening cu dungi | 🧢 | #3b82f6 | men |
| hoodie | Hanorac și bandană | 🧥 | #9ca3af | men |
| bball | Baschet | 🏀 | #8b5cf6 | men |
| bowling | Bowling | 🎳 | #14b8a6 | men |

- [ ] **Step 1: Teste care pică**

În `theme.test.ts`, adaugă:
```ts
test('outfits: 5 women then 5 men, unique ids', () => {
  expect(OUTFITS.map(o => o.group)).toEqual([...Array(5).fill('women'), ...Array(5).fill('men')]);
  expect(new Set([...ELEMENTS, ...OUTFITS].map(o => o.id)).size).toBe(14);
  expect(isOutfit('velour')).toBe(true);
  expect(isOutfit('fire')).toBe(false);
  expect(isOutfit(null)).toBe(false);
});
```
În `useElementSelection.test.ts`, adaugă:
```ts
expect(toggleElement('fire', 'velour')).toBe('velour');
expect(toggleElement('velour', 'velour')).toBeNull();
```
În `save.test.ts`, adaugă:
```ts
expect(captureFileName('tracksuit', 'png', new Date(2026, 10, 13, 9, 5, 0))).toBe('iara-tracksuit-20261113-090500.png');
```

- [ ] **Step 2:** Rulează `npx jest src/__tests__/theme.test.ts src/ui src/capture`. Testele trebuie să pice, pentru că `OUTFITS`/`isOutfit` nu există încă.
- [ ] **Step 3:** Implementează tipurile și datele de mai sus și lărgește semnăturile `toggleElement` și `captureFileName`.
- [ ] **Step 4:** Rulează aceeași comandă. Testele trebuie să treacă.
- [ ] **Step 5:** Nu face commit.

---

### Task 2: Funcții pure pentru corp și camere

**Files:**
- Create: `src/ar/pose.ts`
- Create: `src/ar/cameras.ts`
- Test: `src/ar/__tests__/pose.test.ts`, `src/ar/__tests__/cameras.test.ts`

**Interfaces:**
- Produces, în `src/ar/pose.ts`:
  - `export const POSE = { nose: 0, lEye: 2, rEye: 5, lEar: 7, rEar: 8, lShoulder: 11, rShoulder: 12, lElbow: 13, rElbow: 14, lWrist: 15, rWrist: 16, lHip: 23, rHip: 24, lKnee: 25, rKnee: 26, lAnkle: 27, rAnkle: 28 } as const`
  - `export type PoseFrame = { pts: P3[]; vis: number[] }`, cu 33 de puncte și 33 de scoruri `visibility`
  - `export function pickClosestPose(poses: PoseFrame[], aspect: number): PoseFrame | null`. Întoarce persoana cu cea mai mare distanță între umeri, calculată ca `hypot(dx, dy * aspect)`, unde `aspect = videoHeight / videoWidth`.
  - `export function createBustGate(): { next(vis: number[] | null): boolean }`. Întoarce `true` când se vede tot corpul și `false` când se vede doar bustul. Se uită la media `vis` pentru șolduri și genunchi (23, 24, 25, 26). Trece pe „tot corpul” când media e > 0.65 și pe „bust” când media e < 0.4. Între praguri păstrează ultima stare. Starea inițială e „bust”. Pentru `null` întoarce bust și resetează starea.
- Produces, în `src/ar/cameras.ts`:
  - `export type Facing = 'user' | 'environment'`
  - `export const hasMultipleCameras = (devices: Pick<MediaDeviceInfo, 'kind'>[]): boolean`. Întoarce `true` dacă există cel puțin două `kind === 'videoinput'`.

- [ ] **Step 1: Teste care pică**

În `pose.test.ts`:
- `pickClosestPose`: pentru două persoane, cu umerii la distanță de 0.1 și de 0.3, întoarce persoana cu 0.3. Pentru `[]` întoarce `null`. La `aspect = 0.5625` (16:9), o persoană cu umerii pe verticală la `dy = 0.4` pierde în fața uneia cu `dx = 0.3`.
- `createBustGate`:
  - `[0.5]` → false (pornește pe bust)
  - `0.7` → true
  - `0.5` → true (histerezis)
  - `0.3` → false
  - `0.5` → false
  - `null` → false, iar după el `0.5` → false

În `cameras.test.ts`:
```ts
expect(hasMultipleCameras([{ kind: 'videoinput' }, { kind: 'audioinput' }])).toBe(false);
expect(hasMultipleCameras([{ kind: 'videoinput' }, { kind: 'videoinput' }])).toBe(true);
```
Construiește `vis` cu un helper local: 33 de valori, cu valoarea dată pe indicii 23–26.

- [ ] **Step 2:** Rulează `npx jest src/ar/__tests__/pose.test.ts src/ar/__tests__/cameras.test.ts`. Testele trebuie să pice.
- [ ] **Step 3:** Implementează funcțiile.
- [ ] **Step 4:** Rulează aceeași comandă. Testele trebuie să treacă.
- [ ] **Step 5:** Nu face commit.

---

### Task 3: Descrierea outfiturilor și construirea formelor

**Files:**
- Create: `src/ar/outfits.ts` (datele de stil)
- Create: `src/ar/outfitShapes.ts` (funcție pură: puncte → forme)
- Test: `src/ar/__tests__/outfitShapes.test.ts`

**Interfaces:**
- Consumes: `OutfitId` (Task 1), `PoseFrame`, `POSE` (Task 2)
- Produces, în `src/ar/outfits.ts`:
  ```ts
  export type TopCut = 'crop' | 'tee' | 'oversize' | 'tank' | 'jacket' | 'hoodie' | 'shirt';
  export type Sleeve = 'none' | 'short' | 'long';
  export type BottomCut = 'flare' | 'lowrise' | 'baggy' | 'shorts' | 'miniskirt' | 'cargo' | 'track';
  export type Pattern = 'none' | 'flames' | 'stripes' | 'butterfly' | 'number' | 'mesh' | 'zip';
  export type Accessory = 'tintedGlasses' | 'shieldGlasses' | 'bandana' | 'truckerCap' | 'headband' | 'butterflyClips' | 'choker' | 'hoops' | 'chain' | 'studBelt';
  export type OutfitStyle = {
    top: { cut: TopCut; sleeve: Sleeve; color: string; pattern: Pattern; patternColor: string };
    bottom: { cut: BottomCut; color: string; pattern: Pattern; patternColor: string };
    accessories: { kind: Accessory; color: string }[];
  };
  export const OUTFIT_STYLES: Record<OutfitId, OutfitStyle>;
  ```
- Produces, în `src/ar/outfitShapes.ts`:
  ```ts
  export type Part = 'top' | 'bottom' | 'acc';
  export type Shape = { part: Part; pts: [number, number][]; fill: string; pattern: Pattern; patternColor: string; z: number };
  export function buildOutfitShapes(pose: PoseFrame | null, style: OutfitStyle, fullBody: boolean, w: number, h: number): Shape[];
  ```
  Coordonatele sunt în pixeli de canvas: `x * w`, `y * h`. Formele sunt sortate după `z`, de jos în sus: pantaloni, trunchi, mâneci, accesorii.

`OUTFIT_STYLES` (top / bottom / accessories):

| id | top | bottom | accessories |
|---|---|---|---|
| velour | hoodie, long, #f472b6, zip/#fce7f3 | flare, #f472b6, none | tintedGlasses #f9a8d4 |
| butterfly | crop, short, #ffffff, butterfly/#c084fc | lowrise, #3b6ea8, none | butterflyClips #c084fc, studBelt #d4d4d8 |
| satin | tank, none, #e9d5b7, none | miniskirt, #3b6ea8, none | choker #111111 |
| rock | jacket, long, #1f1f24, zip/#d4d4d8 | cargo, #6b7d4a, none | hoops #facc15 |
| mesh | tank, none, #1f1f24, mesh/#a3a3a3 | lowrise, #3b6ea8, none | bandana #dc2626, shieldGlasses #c0c0c0 |
| flames | oversize, short, #111111, flames/#f97316 | baggy, #3b6ea8, none | chain #d4d4d8 |
| tracksuit | hoodie, long, #1e3a8a, stripes/#ffffff | track, #1e3a8a, stripes/#ffffff | truckerCap #ef4444 |
| hoodie | hoodie, long, #6b7280, zip/#111111 | baggy, #3b6ea8, none | bandana #111111, shieldGlasses #c0c0c0 |
| bball | tank, none, #7c3aed, number/#facc15 | shorts, #7c3aed, stripes/#facc15 | headband #ffffff |
| bowling | shirt, short, #0f766e, flames/#facc15 | cargo, #a8a29e, none | tintedGlasses #fde047 |

Geometria (ca să nu rămână ambiguă):
- **Unitatea** `u` = distanța dintre umeri în pixeli, cu limita inferioară `0.06 * w`. Limita acoperă persoana stând din profil.
- **Trunchiul** e un poligon prin umeri (lărgiți cu `0.15u` spre exterior), șolduri (lărgite cu `0.1u`) și, pentru tivul de jos, punctele de pe linia umăr–șold la fracția dată de croială:
  - `crop` 0.6
  - `tank`, `tee`, `shirt` 1.0
  - `oversize`, `hoodie`, `jacket` 1.1
  
  Când `fullBody === false` și șoldurile au `vis < 0.4`, trunchiul se termină la marginea de jos a canvasului.
- **Mânecile** sunt capsule poligonale (cu 8 puncte pe fiecare capăt rotunjit), cu raza `0.22u`:
  - `short`: umăr → mijlocul segmentului umăr–cot
  - `long`: umăr → cot → încheietura mâinii
  - `none`: fără mâneci
- **Partea de jos** (doar când `fullBody`): fiecare picior e o capsulă șold → genunchi → gleznă.
  - raza `0.25u`
  - `baggy`/`cargo`/`track`: `0.32u`
  - `flare`: crește spre `0.4u` la gleznă
  - `shorts`: doar șold → 60% din drumul spre genunchi
  - `miniskirt`: un trapez de la șolduri la 35% din drumul spre genunchi
- **Accesoriile:**
  - ochelarii stau pe ochi (2, 5), cu lățimea dată de distanța dintre urechi (7, 8)
  - bandana, șapca, bentița și clamele stau deasupra ochilor, la `0.5 * distanța dintre urechi`
  - choker-ul și lanțul stau la mijlocul umerilor, ridicate cu `0.15u`
  - cerceii stau sub urechi
  - cureaua stă pe linia șoldurilor și apare doar când `fullBody`
- **`pose === null`** → `[]`.

- [ ] **Step 1: Teste care pică**

În `outfitShapes.test.ts`, folosește un fixture `standing`: 33 de puncte cu umerii la (0.4, 0.3) și (0.6, 0.3), șoldurile la (0.42, 0.55) și (0.58, 0.55), genunchii la y = 0.75, gleznele la y = 0.95, toate cu `vis` = 0.9.
- `buildOutfitShapes(null, OUTFIT_STYLES.velour, true, 640, 480)` → `[]`
- `fullBody = false` → nicio formă cu `part === 'bottom'`, și există cel puțin o formă `top`
- `fullBody = true` cu `velour` → există forme `bottom`
- `satin` (sleeve `none`) → exact o formă `top` (trunchiul), plus accesorii
- umeri suprapuși (ambii la (0.5, 0.3)) → toate coordonatele sunt finite (`Number.isFinite`), iar lățimea minimă a trunchiului e ≥ `0.06 * 640`
- `z` e crescător în rezultat
- fiecare `id` din `OUTFITS` are o intrare în `OUTFIT_STYLES`

- [ ] **Step 2:** Rulează `npx jest src/ar/__tests__/outfitShapes.test.ts`. Testele trebuie să pice.
- [ ] **Step 3:** Implementează `outfits.ts` și `outfitShapes.ts` după geometria de mai sus.
- [ ] **Step 4:** Rulează aceeași comandă. Testele trebuie să treacă.
- [ ] **Step 5:** Nu face commit.

---

### Task 4: Desenatorul și stratul de outfit în scenă, plus oglindirea

**Files:**
- Create: `src/ar/outfitPainter.ts`
- Modify: `src/ar/scene.ts`

**Interfaces:**
- Consumes: `Shape` (Task 3), `Facing` (Task 2), `OptionId` (Task 1)
- Produces, în `src/ar/outfitPainter.ts`: `export function paintShapes(ctx: CanvasRenderingContext2D, shapes: Shape[], unitPx: number): void`. Funcția golește canvasul, apoi desenează fiecare formă în trei pași:
  1. umplere
  2. model, desenat cu clip pe formă:
     - `stripes`: 2 dungi laterale
     - `flames`: 3 limbi de foc de jos în sus
     - `butterfly`: 2 aripi în centru
     - `number`: textul „88”, care arată la fel și în oglindă
     - `mesh`: grilă diagonală
     - `zip`: o linie verticală în centru
  3. hașuri: linii diagonale negre cu `globalAlpha` 0.35, în treimea dinspre exteriorul formei, apoi contur negru cu `lineWidth = max(3, 0.06 * unitPx)` și `lineJoin = 'round'`
- Modify, în `src/ar/scene.ts`:
  - `createScene(canvas, video)` creează intern un canvas 2D (de mărimea video-ului, redimensionat în `fit()`) și un `Mesh(PlaneGeometry(1,1))` cu `CanvasTexture`. Plasă: `flipY = false`, `transparent`, `depthTest: false`, `renderOrder = 0` (după fundal, înaintea feței). Poziție: `(0.5, 0.5, -0.5)`.
  - `setElement(id)` devine `setOption(id: OptionId | null)`:
    - element → comportamentul de acum
    - outfit → `current = null` (fața și mâinile sunt ascunse), iar stilul de outfit e reținut
    - `null` → totul ascuns
  - Nou: `updateOutfit(pose: PoseFrame | null, fullBody: boolean): void`. Construiește formele (`buildOutfitShapes`), le desenează (`paintShapes`) și setează `texture.needsUpdate = true`. Planul e vizibil doar când opțiunea e outfit și `pose` nu e `null`.
  - Nou: `setFacing(f: Facing): void`. Pentru `'user'` pune `camera.left = 1, camera.right = 0`, pentru `'environment'` pune `camera.left = 0, camera.right = 1`. Apoi apelează `camera.updateProjectionMatrix()`.
  - `dispose()` eliberează și textura, geometria și materialul noi.

- [ ] **Step 1:** Implementează `paintShapes` și modificările din `scene.ts`. Nu se scrie test unitar: jsdom nu are canvas 2D. Verificarea e vizuală, în Task 8.
- [ ] **Step 2:** Rulează `npx tsc --noEmit`. Rezultatul așteptat: singurele erori sunt la apelurile vechi `setElement` din `ArStage.web.tsx`, care se rezolvă în Task 6.
- [ ] **Step 3:** Nu face commit.

---

### Task 5: Tracker cu Pose încărcat la cerere

**Files:**
- Modify: `scripts/fetch-assets.mjs`
- Modify: `src/ar/tracker.ts`

**Interfaces:**
- Consumes: `PoseFrame`, `pickClosestPose` (Task 2)
- Produces:
  - `tracker.loadPose(): Promise<void>`. E idempotentă: al doilea apel întoarce aceeași promisiune. Creează `PoseLandmarker` cu `modelAssetPath: url('models/pose_landmarker.task')`, `runningMode: 'VIDEO'`, `numPoses: 2` și fallback GPU→CPU prin helperul existent `create`.
  - `tracker.detect(video, tMs, want: { face: boolean; hands: boolean; pose: boolean })` întoarce `{ face; hands; handedness; pose: PoseFrame | null }`:
    - `pose` e `null` când `want.pose` e false sau Pose nu e încă încărcat
    - când `want.face` e false, `face` e `null`
    - când `want.hands` e false, rămâne comportamentul de acum (ultimele mâini)
    - `PoseFrame.vis` vine din `landmark.visibility ?? 0`
    - persoana aleasă e dată de `pickClosestPose(…, video.videoHeight / video.videoWidth)`
  - `close()` închide și Pose, dacă e încărcat.
- Modify, în `fetch-assets.mjs`: adaugă `pose_landmarker: \`${base}/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task\``. Fișierul de ieșire e `public/models/pose_landmarker.task`, pentru că bucla existentă îl numește după cheie.

- [ ] **Step 1:** Rulează `node scripts/fetch-assets.mjs` după modificare. Trebuie să existe `public/models/pose_landmarker.task`, de aproximativ 5–6 MB.
- [ ] **Step 2:** Implementează în `tracker.ts`.
- [ ] **Step 3:** Rulează `npx tsc --noEmit`. Rezultatul așteptat: erorile rămân doar în `ArStage.web.tsx` (Task 6).
- [ ] **Step 4:** Nu face commit.

---

### Task 6: ArStage: moduri, schimbarea camerei, vizibilitatea subiectului

**Files:**
- Modify: `src/ar/ArStage.web.tsx`

**Interfaces:**
- Consumes: Tasks 1–5
- Props noi sau redenumite:
  - `element: ElementId | null` → `option: OptionId | null`
  - `facing: Facing` (nou)
  - `onFaceVisible` → `onSubjectVisible: (v: boolean) => void` (fața în modul element, corpul în modul outfit)
  - `onBodyLoading: (loading: boolean) => void` (nou)

Comportament:
- `getUserMedia` folosește `facingMode: cb.current.facing`, iar efectul principal rămâne pe `[retryKey]`. După `createScene`, se apelează `scene.setFacing(cb.current.facing)`.
- În efectul principal se definește `switchRef.current = async (f: Facing) => …`. Pașii:
  1. oprește toate pistele fluxului vechi, apoi cere `getUserMedia` cu `facingMode: f`. Ordinea contează pe iOS.
  2. `video.srcObject = nou` și `await video.play()`
  3. `scene.setFacing(f)`
  4. resetează smoother-ele (față, mâini, corp) și poarta de bust, ca să nu se amestece pozițiile dinainte și de după schimbare
  
  La eroare: `cb.current.onStatus(cameraErrorToStatus(e))`. Un efect separat pe `[facing]` apelează `switchRef.current?.(facing)` și sare peste montarea inițială.
- Un efect pe `[option]`:
  - apelează `scene.setOption(option)`
  - dacă `isOutfit(option)` și Pose nu e încărcat: `onBodyLoading(true)`, apoi `await tracker.loadPose()`, apoi `onBodyLoading(false)`
  - dacă încărcarea eșuează: `onBodyLoading(false)` și `onStatus('error')`
  - logica stă într-o funcție `applyOption()`, care citește tracker-ul și scena din ref-uri. O apelează atât efectul `[option]`, cât și finalul pornirii din efectul principal. Altfel, după „Reîncearcă”, tracker-ul nou nu ar avea Pose încărcat.
- În `step()`:
  - mod outfit: `want = { face: false, hands: false, pose: true }`
  - altfel: `{ face: true, hands: f.hands, pose: false }`
  - corpul trece prin `createSmoother()` pe `pts`, iar `vis` rămâne cel brut
  - `fullBody = bustGate.next(pose?.vis ?? null)`
  - `scene.updateOutfit(smoothedPose, fullBody)`
  - subiectul vizibil e `!!pose` în modul outfit și `!!face` în rest
- Cleanup: `onSubjectVisible(false)`, `switchRef.current = null`.

- [ ] **Step 1:** Implementează.
- [ ] **Step 2:** Rulează `npx tsc --noEmit`. Rezultatul așteptat: erorile rămân doar în `App.tsx` (Task 7).
- [ ] **Step 3:** Nu face commit.

---

### Task 7: Interfața: listă derulantă, buton de cameră, mesaje

**Files:**
- Modify: `src/ui/Dock.tsx`, `src/ui/TopBar.tsx`, `src/ui/StatusOverlay.tsx`, `src/copy.ts`, `App.tsx`

**Interfaces:**
- `Dock`:
  - props `{ active: OptionId | null; onSelect: (id: OptionId) => void; children? }`
  - lista e un `ScrollView` orizontal (`showsHorizontalScrollIndicator={false}`), cu lățimea maximă a ecranului
  - conține trei grupuri, în ordinea `ELEMENTS`, apoi `OUTFITS` cu `women`, apoi `OUTFITS` cu `men`
  - fiecare grup are deasupra eticheta din `GROUP_LABELS` (Inter 11 px, `colors.muted`)
  - se păstrează stilurile existente: pastilă pe ecran lat, cerc pe telefon
- `TopBar`:
  - props `{ recording: boolean; canFlip: boolean; onFlip: () => void }`
  - când `canFlip`, apare un `Pressable` cu textul „↻” în dreapta, înaintea REC
  - `accessibilityLabel={copy.flipCamera}`
  - `disabled={recording}`, iar cât timp e dezactivat are `opacity` 0.4
- `StatusOverlay`:
  - props `{ status; subjectVisible: boolean; subject: 'face' | 'body'; bodyLoading: boolean; onRetry }`
  - `bodyLoading` → `copy.loadingBody`
  - altfel, dacă `!subjectVisible`: pentru `subject === 'face'` → `copy.noFace`, pentru corp → `copy.noBody`
- `copy.ts` adaugă:
  - `noBody: 'Încadrează-te în cadru'`
  - `loadingBody: 'Se încarcă…'`
  - `flipCamera: 'Schimbă camera'`
- `App.tsx`:
  - starea `option` înlocuiește `element`
  - stări noi: `facing` (inițial `'user'`), `canFlip` și `bodyLoading`
  - `canFlip` vine din `navigator.mediaDevices.enumerateDevices().then(d => setCanFlip(hasMultipleCameras(d)))`, rulat când `status` devine `'ready'`, pentru că după permisiune lista e completă
  - `onFlip`: `!recording && setFacing(f => f === 'user' ? 'environment' : 'user')`
  - `captureFileName(option, …)`

- [ ] **Step 1:** Implementează.
- [ ] **Step 2:** Rulează `npx tsc --noEmit`. Rezultatul așteptat: 0 erori.
- [ ] **Step 3:** Rulează `npm test`. Toate testele trebuie să treacă.
- [ ] **Step 4:** Nu face commit.

---

### Task 8: Verificare în browser și pe telefon

- [ ] **Step 1:** `preview_start` cu `iara-web`, apoi verifică consola. Nu trebuie să existe erori.
- [ ] **Step 2:** Pe laptop:
  - lista derulează, iar grupurile apar cu etichetele lor
  - Foc e activ la pornire
  - apăsarea pe un outfit afișează „Se încarcă…”, apoi outfitul pe corp
  - din bust apar doar piesele de sus
  - când te ridici în picioare apar pantalonii, fără să clipească
  - fără nimeni în cadru apare „Încadrează-te în cadru”
  - poza conține outfitul
  - butonul ↻ e ascuns dacă laptopul are o singură cameră
- [ ] **Step 3:** Fă o captură de ecran ca dovadă.
- [ ] **Step 4:** Pe telefon, testul îl face utilizatorul cu `npm run phone`:
  - ↻ schimbă camera în aproximativ o secundă
  - camera din spate nu e în oglindă
  - ↻ e blocat în timpul înregistrării
  - filtrele de față merg și pe camera din spate
  - fluiditatea în modul outfit e bună
- [ ] **Step 5:** Nu face commit. Utilizatorul decide când se face commit.
