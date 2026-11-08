# IARA — filtre AR de element (foc, gheață, pământ, apă) — Design

Data: 2026-11-08 · Status: revizuit (builder check), de aprobat de utilizator

## 1. Intenția și de ce

O aplicație de tip Snapchat, în browser, care la deschidere pornește camera frontală, detectează fața și mâinile și îți „îmbracă” pielea într-un element: lavă, gheață, piatră sau apă. Te poți vedea live, poți face poză sau video și le poți salva pe telefon/laptop.

Utilizatorul vrea React Native explicit, pentru că pe viitor vrea și aplicație standalone pe telefon. Acum: **doar browser**, întâi local, apoi pe GitHub Pages.

Utilizatori: autorul (iPhone — Safari și Chrome, ambele WebKit) și un prieten cu Android (Chrome). Laptopul e secundar.

## 2. Obiective

- Pornește camera frontală automat la deschidere (după permisiune).
- Detectează **fața** (mesh 478 puncte) și **ambele mâini** (21 puncte/mână) în timp real.
- 4 filtre, aplicate ca **mască pe piele** (nu particule, nu doar filtru de culoare):
  - 🔥 **Foc**: piele de rocă de lavă închisă, crăpături portocalii care pulsează/strălucesc, ochi aprinși.
  - ❄️ **Gheață**: piele de cristal albăstrui, crăpături albe de îngheț, ochi albaștri strălucitori.
  - 🌍 **Pământ**: piele de piatră/argilă crăpată, mușchi verde în crăpături, ochi chihlimbarii.
  - 💧 **Apă**: piele translucidă albastră, valuri care curg pe față, reflexii lucioase.
- Masca de față urmărește expresiile (clipit, zâmbet, gură deschisă).
- Mâinile: „mănușă” din forme groase (capsule pe fiecare segment de deget + poligon pe palmă) cu aceeași textură.
- **Captură**: tap = poză, ține apăsat = video. Salvare:
  - iPhone: Web Share API (`navigator.share({files})`) → „Salvează imaginea/videoclipul” → Poze.
  - Android / desktop: download direct (`<a download>`); dacă share cu fișiere e disponibil pe Android, se poate oferi și el.
- Design: dark, minimalist SaaS (Linear / Vercel / Raycast).
- Rulează pe iPhone Safari/Chrome recent și Android Chrome recent, fluid (țintă ≥ 24 fps pe un telefon de 2–3 ani).

## 3. Non-obiective (acum)

- Aplicație instalabilă (APK / iOS) — mai târziu.
- Deploy pe GitHub Pages — mai târziu, dar exportul trebuie să meargă din subcale (`/<repo>/`).
- Particule animate și color grading pe toată imaginea (variante respinse de utilizator; pot veni mai târziu).
- Conturi, backend, galerie în aplicație, partajare pe rețele sociale.
- Comutare pe camera din spate (decizia mea — v1 e selfie; ușor de adăugat).

## 4. Anti-obiective (ar face proiectul un eșec chiar dacă „merge”)

- Masca alunecă vizibil de pe față sau tremură puternic.
- Nu merge pe iPhone Safari (principalul device al autorului).
- Interfață aglomerată / „gamey” în loc de minimalistă.
- Poza/video-ul salvat nu conține masca (doar camera brută).

## 5. Constrângeri

- Camera în browser cere context securizat: `localhost` pe laptop; pe telefon e nevoie de **HTTPS** pentru testarea locală pe rețea (cert de test, utilizatorul acceptă o dată avertismentul) și HTTPS pe GitHub Pages.
- iOS: toate browserele = WebKit. Video: `playsinline` + `muted`. `MediaRecorder` pe Safari produce MP4; Chrome produce WebM (sau MP4 în versiuni noi) — se alege primul `mimeType` suportat.
- Site static (GitHub Pages): fără server; modelele MediaPipe și fișierele WASM sunt servite ca fișiere statice.
- PC-ul de dezvoltare: Windows, Node 24, npm 10, Git. Nu are Java/Android SDK (nu e nevoie acum).

## 6. Abordări luate în calcul

| # | Abordare | Compromis |
|---|----------|-----------|
| **1 (aleasă)** | **Expo (React Native) + react-native-web**; UI în RN (`View`, `Pressable`, `Text`); motorul AR (MediaPipe Tasks Vision + Three.js/WebGL) într-o componentă web separată; `expo export --platform web` → site static | Doar UI-ul e RN „adevărat”; AR-ul e cod web. Drum spre standalone: același motor AR într-un WebView (rapid) sau rescris nativ (calitate mai bună) |
| 2 | React Native CLI + react-native-web configurat manual (bundler propriu) | Același rezultat, mult mai mult setup, zero câștig acum |
| 3 | React simplu (Vite), fără RN | Cel mai simplu pentru web, dar contrazice cerința explicită „React Native” |

Utilizatorul a ales **varianta 1** (recomandarea).

## 7. Ce a decis utilizatorul

- Browser acum, standalone poate mai târziu.
- Local acum, GitHub Pages mai târziu.
- Layout **A**: cameră full-screen + dock plutitor jos cu cele 4 elemente; identic pe desktop, doar mai larg. Bară de sus subțire cu numele aplicației și indicator de înregistrare.
- Stil efect: **mască pe față și mâini** (pielea devine materialul elementului).
- Cele 4 descrieri de piele din §2 — confirmate.
- Poză + video, salvate pe telefon (Poze/Fișiere) sau laptop.
- Device-uri țintă: iPhone 13 sau mai nou (Safari + Chrome) principal, Android Chrome secundar.
- **Calitatea v1: stilizată, rapidă** — textură animată lipită de mesh, cu glow; fără relief/iluminare realistă (se poate crește ulterior). Gata = cele 4 piei arată ca descrierile din §2 și rulează fluid.
- **Acoperire: doar față (frunte–bărbie, zona urmărită de MediaPipe) + mâini.** Gâtul, urechile, părul și brațele rămân normale; fără segmentare de corp.
- **După captură: ecran mic de previzualizare cu „Salvează” și „Renunță”.** Tap-ul pe „Salvează” declanșează `navigator.share` (iPhone → Poze) sau download — ca share-ul să fie mereu în urma unei atingeri.

## 8. Ce am decis eu (de verificat de utilizator)

- **Texturi procedurale în shadere GLSL** (noise/Voronoi animat), nu imagini desenate — fără asset-uri de artă, animabile.
- **Detecția**: `@mediapipe/tasks-vision` — `FaceLandmarker` (1 față) + `HandLandmarker` (2 mâini), mod `VIDEO`, delegate GPU cu fallback CPU. Modelele `.task` și WASM-ul sunt incluse local în proiect (nu de pe CDN), ca să meargă identic local și pe GitHub Pages.
- **Randare**: Three.js într-un `<canvas>`: video-ul ca fundal + mesh-ul feței construit din landmark-uri cu triangulația și UV-urile modelului canonic MediaPipe; ochii și interiorul gurii **nu** sunt acoperite de mască; ochii primesc un glow separat la punctele irisului. Mâinile: capsule + palmă în același spațiu 2D.
- Previzualizarea e în oglindă (ca orice selfie); poza/video-ul salvat păstrează aceeași oglindire ca previzualizarea.
- Captura se face din canvas-ul final (cameră + mască), deci conține efectul.
- Tap pe elementul activ îl dezactivează (camera fără filtru). La pornire **Foc e activ implicit**, ca să se vadă imediat ce face aplicația.
- Video: maxim 30 s, **fără sunet** (evită cererea de permisiune pentru microfon).
- Pragul tap/hold: 300 ms.
- **Când telefonul nu ține ritmul**, ordinea tăierilor: 1) detecția mâinilor la fiecare al doilea cadru, 2) rezoluție de randare mai mică, 3) detaliu mai mic în shader. Fața rămâne detectată la fiecare cadru (stabilitatea măștii e anti-obiectiv #1).
- MediaPipe: delegate GPU, cu fallback automat la CPU dacă inițializarea GPU eșuează pe WebKit.
- Stări de UI: „se încarcă modelele”, „permisiune cameră refuzată” (cu buton de reîncercare și explicație), „nicio față detectată” (hint discret).
- Design: fundal `#0a0a0b`, linii `#232326`, text `#ededef`, font Inter, accent per element (foc `#ff6a2b`, gheață `#7dd3fc`, pământ `#a3794a`, apă `#2563eb`). Dock: pastile cu emoji + nume pe desktop, cercuri colorate pe telefon; buton de captură rotund deasupra dock-ului, centrat.
- Fără Expo Router (un singur ecran) — `App.tsx` simplu.
- Testare locală pe telefon: o comandă care servește aplicația pe HTTPS în rețeaua locală (dev server cu HTTPS sau build exportat servit cu cert local).

## 9. Lăsat la latitudinea constructorului

- Versiunile exacte (Expo SDK stabil curent, Three.js, tasks-vision).
- Detaliile shaderelor, atâta timp cât corespund descrierilor din §2.
- Cum se obține HTTPS local (mkcert, proxy SSL, tunel).
- Rezoluția de procesare pentru performanță (ex. cameră 640×480/720p, detecție la rezoluție redusă, netezirea landmark-urilor anti-tremur).
- Structura fișierelor și testele (minim: logica tap/hold și alegerea `mimeType`).
