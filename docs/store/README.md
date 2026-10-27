# Pubblicare negli store: che cosa è già pronto

L'app non è ancora negli store. Qui c'è tutto quello che si può preparare prima, per rendere semplice il giorno della
pubblicazione. **La pubblicazione la decide chi gestisce il progetto.**

| Che cosa | Dove | Stato |
|---|---|---|
| Due versioni di build: `direct` (GitHub) e `store` | `android/app/build.gradle` (`productFlavors`), `src/config.js` | pronto: la versione store spegne controllo degli aggiornamenti, sostegno e sigilli |
| Livello API 36 (richiesto da Google Play dal 31 agosto 2026) | `compileSdk`/`targetSdk` 36, AGP 8.11.1 | pronto: compila, lint pulito, prova in emulatore 34 e 36 nel CI |
| Pacchetto `.aab` | artefatto `mandarino-store-<versione>` della corsa «APK Android» | pronto, mai pubblicato da solo |
| Firma | [firma.md](firma.md) | da fare nella Play Console |
| Testi, immagini, note di versione | `fastlane/metadata/android/<lingua>/`, [it-IT.md](it-IT.md), [zh-CN.md](zh-CN.md) | pronti (`node tools/store-assets.mjs`) |
| Moduli dello store | [moduli.md](moduli.md) | risposte pronte |
| F-Droid | [f-droid.md](f-droid.md) | struttura pronta, anti-caratteristiche segnalate |
| Test chiuso con 12 tester per 14 giorni | [tester.md](tester.md), pagina `docs/tester.html` | testi pronti |

**Peso.** Il `.aab` pesa circa 84 MB (quasi tutto la musica, 80 MB). Google Play accetta fino a 200 MB di download
compresso per il modulo base, quindi non servono pacchetti di risorse a parte. Se la musica crescesse molto, la si
sposterebbe in un *asset pack* «on demand».

**Due cose da controllare sul testo delle regole di Google Play prima di caricare:**
- un'app non può aggiornarsi da sola fuori dallo store (*Device and Network Abuse*): per questo la versione store non
  controlla le release di GitHub;
- i link a pagamenti fuori da Google Play (*Payments*): per questo la versione store spegne il sostegno. Il link di
  Pleco a `market://` porta a Google Play stesso, quindi è ammesso.
