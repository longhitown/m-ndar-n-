/* ===== màndarínō · le voci reali registrate (Task 12, T5-T6). Frasi lette da persone vere: italiano dalla voce NM1 di
   Tatoeba (CC BY 4.0), cinese da Mozilla Common Voice (CC0). Mai il sesso, l'accento o il numero di chi parla.
   - Indici VOCE_IT / VOCE_ZH (chiave della frase → numero della clip) e catalogo VOICE_FILES (numero → impronta), tutti
     letti al primo uso; il file è audio/voce/<lingua>/<numero>.<impronta>.ogg (tools/build.mjs).
   - Si usano solo se sono sul telefono: nell'APK sono dentro il pacchetto; sul sito dopo «Scarica le voci» (una volta, in
     una cache propria, mandarino-voice, che gli aggiornamenti non cancellano). Altrimenti nessuna richiesta di rete: legge
     la voce del telefono, come prima. CP.speak (core/core.js) chiede qui la clip e, se non parte, torna alla voce di sempre.
   - Chiave: per il cinese solo i caratteri; per l'italiano minuscole senza punteggiatura (come tools/materiali.mjs). ===== */
(function () {
  var CP = window.CP, BASE = "audio/voce/", DLK = "cp-voice-dl", VCACHE = "mandarino-voice";
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function keyZh(s) { return Array.from(String(s)).filter(function (c) { return /[㐀-鿿]/.test(c); }).join(""); }
  function keyIt(s) { return String(s).normalize("NFC").toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.,;:!?¿¡"«»“”()…]/g, " ").replace(/\s+/g, " ").trim(); }
  function cat() { try { return typeof VOICE_FILES !== "undefined" ? VOICE_FILES : null; } catch (e) { return null; } }
  var IDX = {};
  function index(lang) {
    if (IDX[lang]) return IDX[lang];
    var m = {}, V = null; try { V = lang === "zh" ? (typeof VOCE_ZH !== "undefined" ? VOCE_ZH : null) : (typeof VOCE_IT !== "undefined" ? VOCE_IT : null); } catch (e) {}
    ((V && V.righe) || []).forEach(function (r) { if (!m[r[1]]) m[r[1]] = r[0]; });
    return (IDX[lang] = m);
  }
  function apk() { return !!(window.MandarinoAndroid || window.__MD_APK); }
  /* sul telefono: nell'APK sempre; sul sito solo dopo «Scarica le voci» */
  function local() { return apk() || lsGet(DLK) === "1"; }
  function fileUrl(lang, id) { var F = cat(), h = F && F[lang] && F[lang][id]; return h ? BASE + lang + "/" + id + "." + h + ".ogg" : ""; }
  function idOf(text, lang) { return index(lang)[lang === "zh" ? keyZh(text) : keyIt(text)] || null; }
  /* l'indirizzo della clip di una frase, se c'è ed è sul telefono; altrimenti "" */
  function url(text, lang) { if (!text || !local()) return ""; var id = idOf(text, lang); return id ? fileUrl(lang, id) : ""; }
  function langs() { var F = cat() || {}; return ["it", "zh"].filter(function (l) { return F[l] && Object.keys(F[l]).length; }); }
  /* il pulsante «Scarica le voci» e lo scaricamento stanno in ui/voice-dl.js (CP.voiceDl, al primo uso) */
  CP.voiceClip = { url: url, local: local, apk: apk, idOf: idOf, fileUrl: fileUrl, keyIt: keyIt, keyZh: keyZh, langs: langs, cat: cat, DLK: DLK, VCACHE: VCACHE };
})();
