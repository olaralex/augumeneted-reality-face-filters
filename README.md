# IARA

Aplicație web cu filtre AR: fața și mâinile capătă o piele de Foc, Gheață, Pământ sau Apă, în imaginea live a camerei, cu poze și video. Rulează în browser, direct pe telefon.

## Cerințe

- Node 20 sau mai nou

## Instalare

```
npm install
```

Comanda descarcă și modelele MediaPipe necesare (`public/models/`) și copiază fișierele WASM (`public/wasm/`).

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

Aplicația se publică automat pe GitHub Pages la fiecare push pe `main` (workflow-ul `.github/workflows/deploy.yml`).

O singură dată, pe GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Adresa va fi `https://<utilizator>.github.io/<nume-repo>/`. Calea `/<nume-repo>` e pusă automat de workflow (`BASE_URL` în `app.config.js`), deci redenumirea repository-ului nu cere nicio modificare în cod. Local aplicația rămâne la rădăcină (`/`).
