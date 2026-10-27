#!/usr/bin/env node
/* màndarínō · genera la coppia di chiavi dei sigilli di gratitudine (ECDSA P-256), sul computer dell'autore.
   La chiave privata va in un file FUORI dal repository, cifrata con una frase segreta (PKCS#8, AES-256-CBC); la chiave
   pubblica (JWK) si stampa a schermo: va copiata in MD_CONFIG.SEAL_PUBKEYS in src/config.js. Vedi docs/sigilli.md.
     node tools/seal-keygen.mjs [--kid k1]
   Cartella: $MANDARINO_SEAL_HOME, altrimenti ~/.mandarino-sigilli. La frase segreta si chiede a schermo (o
   $MANDARINO_SEAL_PASS, solo per le prove). Non sovrascrive mai una chiave esistente. */
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import readline from "readline";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const HOME = process.env.MANDARINO_SEAL_HOME || path.join(os.homedir(), ".mandarino-sigilli");
const kid = arg("--kid", "k" + new Date().getFullYear());
if (!/^[A-Za-z0-9_-]{1,16}$/.test(kid)) { console.error("kid: solo lettere, cifre, _ e -, al massimo 16"); process.exit(2); }
const file = path.join(HOME, "seal-private-" + kid + ".pem");
if (fs.existsSync(file)) { console.error("Esiste già " + file + ": non la sovrascrivo. Per una chiave nuova usa un altro --kid."); process.exit(1); }
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
if (path.resolve(HOME).startsWith(repo)) { console.error("La cartella delle chiavi non può stare dentro il repository: " + HOME); process.exit(1); }

async function ask(q) {
  if (process.env.MANDARINO_SEAL_PASS) return process.env.MANDARINO_SEAL_PASS;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const a = await new Promise((r) => rl.question(q, r)); rl.close(); return a;
}
const pass = await ask("Frase segreta per la chiave privata (almeno 12 caratteri): ");
if (!pass || pass.length < 12) { console.error("Frase segreta troppo corta."); process.exit(1); }
if (!process.env.MANDARINO_SEAL_PASS) { const again = await ask("Ripetila: "); if (again !== pass) { console.error("Le due frasi non coincidono."); process.exit(1); } }

const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
fs.mkdirSync(HOME, { recursive: true, mode: 0o700 });
fs.writeFileSync(file, privateKey.export({ type: "pkcs8", format: "pem", cipher: "aes-256-cbc", passphrase: pass }), { mode: 0o600 });
const jwk = publicKey.export({ format: "jwk" });
console.log("\n✓ Chiave privata cifrata: " + file);
console.log("  Fanne subito una copia di sicurezza FUORI da GitHub (chiavetta, gestore di password). Senza di lei non si emettono");
console.log("  più sigilli; quelli già dati restano validi.\n");
console.log("Chiave pubblica da mettere in src/config.js, MD_CONFIG.SEAL_PUBKEYS:\n");
console.log(JSON.stringify({ kid, jwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y } }) + "\n");
