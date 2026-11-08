# IARA

Aplicație web cu filtre AR pentru față (căști, ochelari, mănușă etc.), cu cameră live, poze și video. Rulează în browser, direct pe telefon.

## Cerințe

- Node 20 sau mai nou

## Instalare

```
npm install
```

Comanda descarcă și modelele MediaPipe necesare (folderul `models/`).

## Pe laptop

```
npm run web
```

Se deschide http://localhost:8081.

## Pe telefon (aceeași rețea Wi-Fi)

```
npm run phone
```

Comanda construiește aplicația și pornește un server HTTPS (camera nu merge pe telefon fără HTTPS). Pe ecran apar adrese de forma `https://192.168.x.x:8443`. Deschide-o pe telefon, conectat la același Wi-Fi.

Certificatul este făcut local, deci browserul avertizează o dată:

- **iPhone (Safari):** "Afișează detalii" → "vizitează acest site web"
- **Android (Chrome):** "Avansat" → "Continuă"

Prima dată, Windows poate întreba dacă permite Node pe rețele private: alege **Permite**, altfel telefonul nu se poate conecta.

## Cum se folosește

- Atingere scurtă = poză
- Ține apăsat = video
- **Salvează**: pe iPhone alege "Salvează imaginea" / "Salvează videoclipul" din meniul de partajare; pe Android fișierul apare în Descărcări / Galerie.

## Teste

```
npm test
```

## Publicare

Publicarea pe GitHub Pages vine mai târziu: va trebui setat `experiments.baseUrl` la `/<nume-repo>` în `app.json`.
