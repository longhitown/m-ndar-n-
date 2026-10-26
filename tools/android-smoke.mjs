#!/usr/bin/env node
/* màndarínō · prova dell'APK su un dispositivo o emulatore Android (adb), senza dipendenze.
   Installa l'APK di debug (quello di prova: permette di collegarsi alla pagina con il protocollo DevTools), lo apre e
   controlla, dentro la WebView vera:
     1. la pagina si carica all'origine dell'app, con le 3500 parole;   2. #selftest tutto verde;
     3. il backup si salva in Download con l'UTF-8 intatto;            4. il microfono (getUserMedia) funziona;
     5. i dati restano dopo la chiusura forzata dell'app;              6. il tasto Indietro chiude il foglio e torna al Percorso;
     7. il motore della pagina non va mai in crash (logcat).
   Uso: node tools/android-smoke.mjs android/app/build/outputs/apk/debug/app-debug.apk   (serve adb nel PATH o ANDROID_HOME) */
import { execFileSync } from "child_process";
import path from "path";

const apk = process.argv[2];
if (!apk) { console.error("Uso: node tools/android-smoke.mjs app-debug.apk"); process.exit(2); }
const ADB = process.env.ANDROID_HOME ? path.join(process.env.ANDROID_HOME, "platform-tools", "adb") : "adb";
const PKG = "it.mandarino.app", PORT = 9223;
const adb = (...a) => execFileSync(ADB, a, { encoding: "utf8", maxBuffer: 64 << 20 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail) => { results.push(!!ok); console.log((ok ? "✓ " : "✗ ") + name + (detail ? " — " + detail : "")); };

async function connect(timeoutMs) {
  const end = Date.now() + timeoutMs;
  let sock = "";
  while (!sock && Date.now() < end) { const m = /webview_devtools_remote_\d+/.exec(adb("shell", "cat", "/proc/net/unix")); sock = m ? m[0] : ""; if (!sock) await sleep(2000); }
  if (!sock) throw new Error("la WebView non espone il debug (l'APK deve essere di debug)");
  try { adb("forward", "--remove", "tcp:" + PORT); } catch (e) {}
  adb("forward", "tcp:" + PORT, "localabstract:" + sock);
  let t = null;
  while (!t && Date.now() < end) { try { t = (await (await fetch("http://127.0.0.1:" + PORT + "/json")).json()).find((x) => x.type === "page" && /appassets/.test(x.url)); } catch (e) {} if (!t) await sleep(2000); }
  if (!t) throw new Error("nessuna pagina dell'app");
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = () => j(new Error("websocket")); });
  let id = 0; const pend = {};
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } };
  const ev = (fn, arg, ms = 60000) => new Promise((res, rej) => {
    const i = ++id, tm = setTimeout(() => { delete pend[i]; rej(new Error("timeout")); }, ms);
    pend[i] = (d) => { clearTimeout(tm); const r = d.result || {}; if (r.exceptionDetails) rej(new Error(JSON.stringify(r.exceptionDetails).slice(0, 300))); else res(r.result ? r.result.value : undefined); };
    ws.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression: "(" + fn + ")(" + JSON.stringify(arg === undefined ? null : arg) + ")", awaitPromise: true, returnByValue: true } }));
  });
  const until = async (fn, ms) => { const e = Date.now() + ms; for (;;) { try { if (await ev(fn, null, 15000)) return true; } catch (x) {} if (Date.now() > e) return false; await sleep(1000); } };
  return { ev, until, close: () => ws.close() };
}
async function start() {
  adb("shell", "am", "force-stop", PKG);
  adb("shell", "am", "start", "-W", "-n", PKG + "/.MainActivity");
  const p = await connect(240000);
  await p.until("() => window.CP && CP.ORDER && document.readyState === 'complete'", 240000);
  return p;
}

try {
  adb("install", "-r", "-g", apk);
  adb("logcat", "-c");
  adb("shell", "pm", "clear", PKG);
  adb("shell", "pm", "grant", PKG, "android.permission.RECORD_AUDIO");
  let p = await start();
  const info = await p.ev("() => ({ apk: window.__MD_APK, words: CP.ORDER.length, secure: isSecureContext, url: location.href, sw: !!(navigator.serviceWorker && navigator.serviceWorker.controller) })");
  check("Pagina caricata nell'APK (origine sicura, 3500 parole, niente service worker)", info.apk && info.words === 3500 && info.secure && !info.sw, JSON.stringify(info));

  await p.ev("() => { localStorage.setItem('cp-ux-v1', '{\"onboarded\":1}'); location.hash = '#selftest'; location.reload(); }").catch(() => {});
  p.close(); await sleep(3000); p = await connect(120000);
  const stOk = await p.until("() => !!window.__SELFTEST", 300000);
  const st = stOk ? await p.ev("() => ({ pass: __SELFTEST.pass, total: __SELFTEST.total, ko: __SELFTEST.results.filter(r => !r.ok).map(r => r.name + ': ' + r.detail) })") : null;
  check("#selftest dentro Android", st && st.pass === st.total, st ? st.pass + "/" + st.total + " " + st.ko.join(" | ") : "non finito");

  await p.ev("() => { history.replaceState(null, '', location.pathname); localStorage.setItem('cp-prova-apk', 'resta'); }");
  try { adb("shell", "rm", "-f", "/sdcard/Download/mandarino-prova-apk.json"); } catch (e) {}
  await p.ev("() => Store.download('mandarino-prova-apk.json', JSON.stringify({ app: 'mandarino', nota: 'àèìòù 你好' }))");
  await sleep(4000);
  let saved = ""; try { saved = adb("shell", "cat", "/sdcard/Download/mandarino-prova-apk.json"); } catch (e) {}
  check("Backup salvato in Download, UTF-8 intatto", /àèìòù 你好/.test(saved), saved.trim().slice(0, 60));

  const mic = await p.ev("() => navigator.mediaDevices.getUserMedia({ audio: true }).then(s => { s.getTracks().forEach(t => t.stop()); return 'ok'; }, e => e.name + ': ' + e.message)", null, 30000).catch((e) => e.message);
  /* NotReadableError = il permesso c'è ma il dispositivo non ha un microfono da aprire (emulatore senza audio) */
  const noDevice = /^NotReadableError/.test(mic) && (adb("shell", "getprop", "ro.boot.qemu").trim() === "1" || /sdk_gphone|emulator|Android SDK built/i.test(adb("shell", "getprop", "ro.product.model")));
  check("Microfono dalla pagina (getUserMedia)" + (noDevice ? ": permesso concesso, l'emulatore non ha un microfono" : ""), mic === "ok" || noDevice, mic);
  const tts = await p.ev("() => ({ ready: MandarinoAndroid.ttsReady(), it: MandarinoAndroid.ttsHasLang('it-IT'), zh: MandarinoAndroid.ttsHasLang('zh-CN'), voices: speechSynthesis.getVoices().length, sr: typeof SpeechRecognition })");
  console.log("  (voce del dispositivo: " + JSON.stringify(tts) + ")");
  p.close();

  p = await start();
  check("I dati restano dopo la chiusura dell'app", await p.ev("() => localStorage.getItem('cp-prova-apk') === 'resta'"));
  await p.ev("() => { CP.show('words', true); CP.openSheet('<div>prova<button data-famclose>x</button></div>'); }");
  adb("shell", "input", "keyevent", "KEYCODE_BACK"); await sleep(2500);
  const b1 = await p.ev("() => ({ sheet: !document.getElementById('fam').hidden, path: !document.getElementById('view-path').hidden })");
  adb("shell", "input", "keyevent", "KEYCODE_BACK"); await sleep(2500);
  const b2 = await p.ev("() => !document.getElementById('view-path').hidden");
  check("Indietro: chiude il foglio, poi torna al Percorso", !b1.sheet && !b1.path && b2, JSON.stringify([b1, b2]));
  p.close();

  const log = adb("logcat", "-d");
  const crashes = log.split("\n").filter((l) => /Renderer process .*crash|FATAL EXCEPTION.*|Process: it\.mandarino\.app/.test(l) && !/com\.android\.(phone|bluetooth|systemui|settings)/.test(l));
  check("Nessun crash dell'app o del motore della pagina", !crashes.length, crashes.slice(0, 3).join(" | "));
} catch (e) {
  check("Prova completata", false, e.message);
}
console.log("\n" + results.filter(Boolean).length + "/" + results.length + " prove superate sul dispositivo.");
process.exit(results.every(Boolean) ? 0 : 1);
