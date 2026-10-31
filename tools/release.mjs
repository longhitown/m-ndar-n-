#!/usr/bin/env node
/* màndarínō · prepara una release STABILE, uguale per tutti i canali (APK diretto, Google Play, F-Droid).

   node tools/release.mjs 0.9.1             prepara la release 0.9.1 in locale
   node tools/release.mjs 0.9.1 --prova     mostra che cosa farebbe, senza scrivere niente
   node tools/release.mjs 0.9.1 --senza-prove   non lancia build.mjs e unit.mjs (le lancerà la CI)

   Non fa commit, non fa push, non usa la rete. Controlla: albero git pulito, ramo main non indietro rispetto a origin/main
   (confronto con quello che c'è già in locale, senza fetch), formato x.y.z, versione maggiore della precedente, tag non già usato.
   Poi scrive android/version.properties (versionCode = max(precedente + 1, numero di commit + 50): sempre sopra a qualunque APK
   costruito dalla CI a ogni push) e crea changelogs/<versionCode>.txt in ogni lingua di fastlane/metadata/android/.
   Solo Node, nessuna dipendenza. La logica pura è esportata e provata da tools/unit.mjs. */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PROPS = "android/version.properties";
export const META = "fastlane/metadata/android";
export const NOTE_MAX = 500;   /* limite di Google Play per le note di versione */
export const MARGINE = 50;     /* il versionCode di una release sta sempre sopra al numero di commit di almeno tanto */

/* ---- logica pura ---- */
export function parseVersion(s) {
  const m = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(String(s || ""));
  return m ? [+m[1], +m[2], +m[3]] : null;
}
export function compareVersions(a, b) {
  const x = parseVersion(a), y = parseVersion(b);
  if (!x || !y) throw new Error("versione non valida: " + (x ? b : a));
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1;
  return 0;
}
/* la più alta tra le versioni date (le non valide si ignorano); null se non ce n'è nessuna */
export function maxVersion(list) {
  let best = null;
  for (const v of list) if (parseVersion(v) && (best === null || compareVersions(v, best) > 0)) best = v;
  return best;
}
export function nextVersionCode(previous, commitCount) {
  if (!Number.isInteger(previous) || previous < 1) throw new Error("versionCode precedente non valido: " + previous);
  if (!Number.isInteger(commitCount) || commitCount < 0) throw new Error("numero di commit non valido: " + commitCount);
  return Math.max(previous + 1, commitCount + MARGINE);
}
export function readProps(text) {
  const code = /^versionCode=(\d+)\s*$/m.exec(text), name = /^versionName=(.+?)\s*$/m.exec(text);
  if (!code) throw new Error("manca la riga versionCode=<numero> in " + PROPS);
  if (!name) throw new Error("manca la riga versionName=<x.y.z> in " + PROPS);
  return { versionCode: +code[1], versionName: name[1] };
}
/* riscrive le due righe lasciando intatti i commenti; fine riga sempre LF */
export function writeProps(text, v) {
  readProps(text);
  return text.replace(/\r\n/g, "\n").replace(/^versionCode=.*$/m, "versionCode=" + v.versionCode).replace(/^versionName=.*$/m, "versionName=" + v.versionName)
    .replace(/\n*$/, "\n");
}
export function noteProblem(text) {
  const t = String(text || "").trim();
  if (!t) return "vuota";
  if ([...t].length > NOTE_MAX) return [...t].length + " caratteri, il limite è " + NOTE_MAX;
  return "";
}

/* ---- git e file ---- */
function git(...a) { return execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
function gitOk(...a) { try { return git(...a); } catch (e) { return null; } }
const rd = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

function main(argv) {
  const prova = argv.includes("--prova"), senzaProve = argv.includes("--senza-prove");
  const version = argv.find((a) => !a.startsWith("--"));
  const bad = [], warn = [];   /* bad: ferma; warn: nella prova non ferma, e anche nella corsa vera sono solo avvisi */
  const fail = (m) => { console.error("✗ " + m); process.exit(1); };
  if (!version) fail("Uso: node tools/release.mjs <versione x.y.z> [--prova] [--senza-prove]");
  if (!parseVersion(version)) fail("«" + version + "» non è una versione nel formato x.y.z (tre numeri senza zeri iniziali, per esempio 0.9.1).");

  let cur;
  try { cur = readProps(rd(PROPS)); } catch (e) { fail(e.message); }
  const tags = (gitOk("tag", "--list", "r[0-9]*.[0-9]*.[0-9]*") || "").split("\n").map((t) => t.replace(/^r/, "")).filter(Boolean);
  const previous = maxVersion([cur.versionName, ...tags]);
  if (compareVersions(version, previous) <= 0) fail("La versione " + version + " non è maggiore della precedente (" + previous + ").");
  if (tags.includes(version)) fail("Esiste già il tag r" + version + ".");

  /* stato di git: nella prova sono avvisi, nella corsa vera fermano */
  const problem = (m) => (prova ? warn : bad).push(m);
  if (gitOk("status", "--porcelain") !== "") problem("L'albero git non è pulito: fai prima commit o stash delle modifiche.");
  const branch = gitOk("rev-parse", "--abbrev-ref", "HEAD");
  if (branch !== "main") problem("Sei sul ramo «" + branch + "»: le release si preparano da main.");
  if (gitOk("rev-parse", "--verify", "--quiet", "origin/main")) {
    const indietro = +gitOk("rev-list", "--count", "HEAD..origin/main"), avanti = +gitOk("rev-list", "--count", "origin/main..HEAD");
    if (indietro > 0) problem("main è indietro di " + indietro + " commit rispetto a origin/main (git pull).");
    if (avanti > 0) warn.push("main ha " + avanti + " commit non ancora su origin/main.");
  } else warn.push("Non c'è origin/main in locale: non posso controllare che main sia aggiornato (git fetch).");
  if (bad.length) { bad.forEach((m) => console.error("✗ " + m)); process.exit(1); }

  const commits = +git("rev-list", "--count", "HEAD");
  const code = nextVersionCode(cur.versionCode, commits);
  console.log((prova ? "[prova: non scrivo niente]\n" : "") + "Release " + version + " (precedente " + previous + ")");
  console.log("  versionCode " + code + " = max(" + cur.versionCode + " + 1, " + commits + " commit + " + MARGINE + ")");
  warn.forEach((m) => console.log("  avviso: " + m));

  /* note di versione: una per lingua, copiate da default.txt */
  const langs = fs.existsSync(path.join(ROOT, META)) ? fs.readdirSync(path.join(ROOT, META), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort() : [];
  const notes = [];
  for (const L of langs) {
    const dir = path.join(META, L, "changelogs"), def = path.join(dir, "default.txt"), out = path.join(dir, code + ".txt");
    if (!fs.existsSync(path.join(ROOT, def))) { console.log("  ✗ " + L + ": manca " + def.replace(/\\/g, "/") + " (le note vanno scritte a mano, o con node tools/store-assets.mjs --notes " + code + ")"); continue; }
    const t = rd(def), p = noteProblem(t);
    if (fs.existsSync(path.join(ROOT, out))) { console.log("  = " + L + ": " + out.replace(/\\/g, "/") + " esiste già, non lo tocco"); continue; }
    notes.push({ L, def, out, t });
    console.log("  + " + L + ": " + out.replace(/\\/g, "/") + " (copia di default.txt, " + [...t.trim()].length + " caratteri)" + (p ? "  ✗ " + p : ""));
  }
  console.log("  ~ " + PROPS + ": versionCode=" + code + ", versionName=" + version);

  if (prova) { console.log("\nNessun file toccato (--prova)."); steps(version, code); return; }

  const lunghe = notes.filter((n) => noteProblem(n.t));
  if (lunghe.length) fail("Note di versione da correggere in default.txt (" + lunghe.map((n) => n.L + ": " + noteProblem(n.t)).join("; ") + "): niente è stato scritto.");
  /* le prove prima di scrivere: se falliscono non resta niente a metà */
  if (senzaProve) console.log("\nProve saltate (--senza-prove): le farà la CI, ma lanciale tu prima del commit.");
  else for (const s of ["tools/build.mjs", "tools/unit.mjs"]) {
    console.log("\n$ node " + s);
    try { execFileSync(process.execPath, [s], { cwd: ROOT, stdio: "inherit" }); } catch (e) { fail("«node " + s + "» è fallito: niente è stato scritto."); }
  }
  for (const n of notes) fs.writeFileSync(path.join(ROOT, n.out), n.t.trim() + "\n");
  fs.writeFileSync(path.join(ROOT, PROPS), writeProps(rd(PROPS), { versionCode: code, versionName: version }));
  console.log("\n✓ Pronto. File modificati: " + PROPS + (notes.length ? ", " + notes.length + " note di versione" : "") + ". Nessun commit.");
  steps(version, code);
}

function steps(version, code) {
  console.log(`
Che cosa fare adesso (nell'ordine):
  1. Rivedi le note di versione, una per lingua (massimo ${NOTE_MAX} caratteri ciascuna, è il limite di Google Play):
     ${META}/<lingua>/changelogs/${code}.txt
  2. Ramo e commit:
       git switch -c release/${version}
       git add ${PROPS} ${META}
       git commit -m "Versione ${version}"
  3. Apri la pull request, aspetta i controlli verdi, fai il merge in main.
  4. Sul commit di main:
       git switch main && git pull
       git tag r${version}
       git push origin r${version}
     (in alternativa: gh release create r${version} --target main --title "màndarínō ${version}"; il workflow «release» completa la Release)
  5. Segui la corsa «release» in Actions. Alla fine: carica mandarino-store.aab nella Play Console; F-Droid segue il tag da solo.
Dettagli e rollback: docs/store/rilascio.md`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
