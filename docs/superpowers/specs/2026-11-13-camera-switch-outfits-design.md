# IARA: schimbare cameră și outfituri Y2K (design)

Data: 2026-11-13 · Status: aprobat de utilizator (inclusiv toate propunerile din secțiunea 8) · Fără commit și fără push până la acordul utilizatorului.

## 1. Intenția și de ce

Utilizatorul vrea două lucruri noi în aplicație:

1. Să poată **schimba camera**: frontală sau cea de pe spate.
2. Să poată **„îmbrăca” persoana din cadru** cu un outfit dintr-o listă fixă, ca să vadă cum ar arăta. Nu e o probă realistă. E o vizualizare jucăușă, desenată.

Stilul înseamnă haine **Y2K (retro 2004)**, desenate în stilul **cartoonish al jocului Borderlands**: contur negru gros, culori plate, umbre în trepte, hașuri pe zonele de umbră. Se ia doar stilul de desen. Nu se copiază personaje, logouri sau haine din joc.

Această specificație anulează non-obiectivul din specificația din 2026-11-08 („Comutare pe camera din spate”).

## 2. Obiective

- Un buton de schimbare a camerei (frontală ↔ spate).
- O singură listă de opțiuni în bara de jos, ca acum. E activă **o singură opțiune odată**: un filtru pe față **sau** un outfit. Apăsarea pe opțiunea activă o oprește, la fel ca acum.
- Lista e împărțită în trei grupuri: **Elemente · Femei · Bărbați**. Utilizatorul alege grupul. Aplicația nu ghicește genul.
- 10 outfituri. Fiecare are piese **de sus** și piese **de jos**:

| Grup | Outfit | Sus | Jos |
|---|---|---|---|
| Femei | Trening de catifea roz | hanorac scurt cu fermoar, ochelari cu lentile roz | pantaloni evazați de catifea |
| Femei | Baby tee cu fluture | tricou scurt cu fluture, clame fluture în păr | blugi cu talie joasă, curea cu ținte |
| Femei | Satin și denim | top cu bretele subțiri din satin, choker | fustă mini din blugi |
| Femei | Rock | geacă scurtă de piele, top fără bretele, cercei mari rotunzi | pantaloni cargo |
| Femei | Bandană și plasă | top din plasă peste maiou, bandană, ochelari scut | (din grupul de jos: blugi cu talie joasă) |
| Bărbați | Flăcări | tricou larg cu flăcări, lanț gros | blugi foarte largi |
| Bărbați | Trening cu dungi | bluză de trening cu dungi, șapcă trucker | pantaloni de trening cu dungi |
| Bărbați | Hanorac și bandană | hanorac cu fermoar, bandană, ochelari scut | (blugi largi) |
| Bărbați | Baschet | maiou de baschet cu număr, bentiță | șort lung și larg |
| Bărbați | Bowling | cămașă de bowling cu flăcări, ochelari colorați | pantaloni cargo |

- **Doar bustul în cadru** (cap, umeri, o parte din piept): se desenează doar piesele de sus.
- Se îmbracă **doar persoana cea mai apropiată** de cameră.
- Poza și video-ul conțin outfitul, la fel cum conțin acum filtrele.

## 3. Non-obiective

- Mai multe persoane îmbrăcate deodată (poate mai târziu, la cerere).
- Haine realiste, 3D sau cu fizică de material.
- Recunoașterea automată a genului.
- Filtru pe față și outfit în același timp.
- Outfituri definite de utilizator sau încărcate din fișiere.

## 4. Anti-obiective

- Hainele tremură sau „sar” vizibil de pe corp.
- Aplicația devine sacadată pe telefon când e activ un outfit.
- Pantalonii plutesc în aer când se vede doar bustul.
- Desenul seamănă cu personaje sau materiale din joc, nu doar cu stilul lui.
- Pe camera din spate imaginea e în oglindă, cu stânga și dreapta inversate.

## 5. Constrângeri

- Rulează în browser pe iPhone (Safari și Chrome) și Android (Chrome), la ≥ 24 fps pe un telefon de 2–3 ani, ca până acum.
- Site static: modelul de corp e un fișier `.task` servit din `public/models/`, descărcat de `scripts/fetch-assets.mjs`.
- Biblioteca `@mediapipe/tasks-vision` 1.1.1 e deja instalată și conține `PoseLandmarker`. Nu se adaugă dependențe noi.
- Modelul Pose dă 33 de puncte: nas, ochi, urechi, umeri, coate, încheieturi, șolduri, genunchi și glezne. Fiecare are un scor `visibility`. Punctele din afara cadrului sunt totuși estimate, așa că poziția singură nu spune dacă o parte a corpului se vede.

## 6. Abordări luate în calcul

| # | Abordare | Compromis |
|---|---|---|
| A | Piese desenate dinainte, întinse pe segmente de corp, ca o păpușă de hârtie | Detalii fine, dar „cusături” și goluri la încheieturi; aproximativ 60 de piese de desenat |
| **B (aleasă)** | **Haine desenate din cod la fiecare cadru** după punctele corpului: poligon pentru trunchi, forme groase pentru mâneci și pantaloni, contur negru gros, hașuri | Haina rămâne dintr-o bucată și urmează corpul. Stilul de benzi desenate iese natural. Detaliile sunt mai simple decât într-un desen de mână |
| C | Haine 3D cu umbre de desen animat | Prea grea pentru telefon, iar realismul nu a fost cerut. Respinsă |

Utilizatorul a ales **B**. Pentru cameră există o singură cale: repornirea fluxului video cu `facingMode` schimbat și scoaterea oglindirii.

## 7. Cum se construiește (decis cu utilizatorul)

### 7.1 Schimbarea camerei
- Starea `facing: 'user' | 'environment'` e ținută în `App.tsx` și trimisă către `ArStage`.
- `getUserMedia` folosește `facingMode: facing`.
- Scena primește direcția camerei. Camera ortografică e `(1, 0, …)` pentru cea frontală, cu oglindire ca acum, și `(0, 1, …)` pentru cea din spate, fără oglindire.
- Butonul de schimbare e blocat cât timp se înregistrează, la fel ca bara de jos acum.

### 7.2 Lista unică
- Tipul selecției se lărgește de la `ElementId` la o opțiune care e fie element, fie outfit (de exemplu `OptionId = ElementId | OutfitId`).
- Fișiere atinse:
  - `src/theme.ts`, unde intră lista outfiturilor și grupurile
  - `src/ui/useElementSelection.ts` și testul lui
  - `App.tsx`
  - `src/ar/ArStage.web.tsx` (prop-ul `element`)
  - `src/ar/scene.ts` (`setElement`)
  - `src/capture/save.ts` (`captureFileName`) și testul lui
  - `src/ui/Dock.tsx`
- `Dock` devine o listă derulantă orizontal cu cele trei etichete de grup, atât pe telefon cât și pe ecran lat. Pe ecran lat, 14 butoane tip pastilă nu mai încap nici ele.

### 7.3 Detectarea corpului
- Se adaugă `pose_landmarker` în `fetch-assets.mjs` și `PoseLandmarker` în `tracker.ts`.
- „Cea mai apropiată persoană” înseamnă persoana cu cea mai mare distanță între umeri, aleasă dintre până la 2 persoane detectate. Cu `numPoses: 1`, MediaPipe ar întoarce pur și simplu persoana cea mai sigură, nu cea mai apropiată.
- Punctele corpului sunt netezite cu smoother-ul existent (`createSmoother`), ca să nu tremure.

### 7.4 Doar bustul
- O funcție pură decide modul „corp întreg” sau „bust” după scorurile `visibility` ale șoldurilor și genunchilor, cu histerezis, ca să nu clipească la limită.
- Funcția are test în `src/ar/__tests__/`, ca celelalte funcții pure.

### 7.5 Desenul
- Un canvas 2D, de mărimea video-ului, desenat în coordonatele imaginii.
- E încărcat ca `CanvasTexture` pe un plan în scena ortografică existentă. Astfel oglindirea, poza și video-ul funcționează fără cod în plus.
- Lățimile formelor folosesc aceeași corecție de aspect ca strălucirea ochilor.
- Fiecare outfit e o descriere scurtă (date, nu cod separat):
  - culori
  - forma topului (scurt, lung, larg, fără mâneci)
  - forma pantalonilor (evazați, largi, șort, fustă)
  - un model (flăcări, dungi, fluture, număr, plasă)
  - accesorii
- Un singur „desenator” transformă orice descriere în forme.

### 7.6 Mesajul de încadrare
- Acum mesajul „Încadrează-ți fața” depinde de detectarea feței. În modul outfit, mesajul devine „Încadrează-te în cadru” și depinde de detectarea corpului.

## 8. Propuneri ale mele, de aprobat de utilizator

Utilizatorul a cerut să fie întrebat la fiecare decizie, așa că niciuna dintre acestea nu e considerată acceptată:

1. **Iconița de schimbare cameră** (↻) în dreapta sus, în bara cu „IARA”, lângă REC.
2. **Durata schimbării camerei.** Propun să repornesc doar camera, fără să reîncarc modelele. Schimbarea durează aproximativ o secundă, nu câteva.
3. **Laptop sau dispozitiv cu o singură cameră.** Propun ca butonul să fie ascuns dacă se găsește o singură cameră.
4. **Modelul de corp.** Propun varianta „lite” (aproximativ 5 MB), cea mai rapidă pe telefon, cu precizie ceva mai mică.
5. **Când se încarcă modelul de corp.** Propun la prima atingere pe un outfit, cu un scurt „Se încarcă…”. Pornirea aplicației rămâne la fel de rapidă ca acum.
6. **Ce rulează în fiecare mod.** În modul outfit rulează doar detectarea corpului. În modul filtru rulează doar fața și mâinile, ca acum. Nu rulează toate trei deodată, pentru viteză.
7. **Accesoriile de cap** (ochelari, bandană, șapcă, clame) se așază după punctele de nas, ochi și urechi din modelul de corp, nu după modelul de față. Sunt mai puțin precise, dar aplicația rămâne rapidă.
8. **Opțiunea activă la pornire** rămâne Foc, ca acum.
9. **Numele fișierului salvat** primește id-ul outfitului, de exemplu `iara-trening-catifea-20261113-….png`.
10. **Lipsa unei piese de jos.** La outfiturile 5 (femei) și 3 (bărbați), care nu aveau pantaloni în listă, am pus blugi (trecuți în paranteză în tabel).
11. **Desenul e mai simplu decât o ilustrație.** Flăcările, fluturele, numărul și dungile sunt forme simple, nu desene detaliate.

## 9. Lăsat la latitudinea constructorului

- Culorile exacte, grosimea conturului și densitatea hașurilor, în limitele stilului.
- Pragurile exacte de vizibilitate și histerezis, calibrate pe telefon.
- Cum se integrează detectarea corpului în guvernorul de performanță existent (`governor.ts`).
