/* màndarínō · lettura e scrittura di file .zip (Node, nessuna dipendenza: solo zlib).
   Usata da tools/voice-import.mjs, che apre pacchetti arrivati da sconosciuti (docs/scambio-linguistico.md, «Il filtro»).

   readZip è scritta per NON fidarsi di nulla: il file viene trattato come dati ostili. Non esegue niente, non scrive niente su disco,
   e rifiuta il pacchetto intero (con ZipError) alla prima anomalia, perché l'app non produce mai file anomali:
     - nomi con «..», «/» iniziale, «\», lettera di unità, byte nulli o caratteri di controllo, nomi doppi (anche per maiuscole);
     - più di 201 voci, una voce oltre 300 KB decompressa, più di 30 MB in tutto;
     - rapporto di compressione sospetto (zip bomb) e voci che si sovrappongono (la «bomba» che si autocita);
     - cifratura, ZIP64, più dischi; metodi diversi da «store» (0) e «deflate» (8);
     - dimensioni dichiarate che non tornano con quelle vere, intestazione locale diversa da quella centrale, CRC32 errato.
   Le dimensioni e i CRC si leggono dall'elenco centrale (l'unico affidabile), e deflate ha un tetto d'uscita: non si decomprime mai
   più di quanto dichiarato (e già accettato). writeZip è lo scrittore «store» minimo (lo stesso formato di CP._zip in src/pwa/pwa.js). */
import zlib from "zlib";

export const LIMITS = { files: 201, fileBytes: 300 * 1024, totalBytes: 30 * 1024 * 1024, zipBytes: 40 * 1024 * 1024, ratio: 100, ratioFrom: 1024, nameBytes: 255 };

export class ZipError extends Error { constructor(m) { super(m); this.name = "ZipError"; } }

const TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

/* nome sicuro: solo percorsi relativi, puliti, senza trucchi. Restituisce il motivo del rifiuto o "" se va bene */
export function badName(n) {
  if (!n) return "nome vuoto";
  if (/\p{C}/u.test(n)) return "il nome contiene byte nulli o caratteri di controllo";
  if (n.includes("\\")) return "il nome contiene «\\»";
  if (n.startsWith("/")) return "il nome inizia con «/»";
  if (/^[A-Za-z]:/.test(n)) return "il nome inizia con una lettera di unità";
  if (n.endsWith("/")) return "è una cartella, non un file";
  if (n.split("/").some((s) => s === ".." || s === "." || s === "")) return "il nome contiene «..» o segmenti vuoti";
  return "";
}

/* ---------- scrittura (store; per i test anche deflate e dati «sbagliati» apposta) ----------
   files: [{ name, data(Buffer|string), method?: 0|8, crc?, usize? }] — crc e usize servono solo a costruire pacchetti difettosi nei test */
export function writeZip(files) {
  const parts = [], cen = [];
  let off = 0;
  const w16 = (v) => { const b = Buffer.alloc(2); b.writeUInt16LE(v & 0xFFFF); return b; };
  const w32 = (v) => { const b = Buffer.alloc(4); b.writeUInt32LE(v >>> 0); return b; };
  for (const f of files) {
    const nm = Buffer.from(f.name, "utf8"), raw = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data, "utf8");
    const method = f.method === 8 ? 8 : 0, d = method === 8 ? zlib.deflateRawSync(raw) : raw;
    const c = f.crc !== undefined ? f.crc : crc32(raw), us = f.usize !== undefined ? f.usize : raw.length;
    const h = Buffer.concat([w32(0x04034b50), w16(20), w16(0x0800), w16(method), w16(0), w16(0x21), w32(c), w32(d.length), w32(us), w16(nm.length), w16(0)]);
    parts.push(h, nm, d);
    cen.push(Buffer.concat([w32(0x02014b50), w16(20), w16(20), w16(0x0800), w16(method), w16(0), w16(0x21), w32(c), w32(d.length), w32(us), w16(nm.length), w16(0), w16(0), w16(0), w16(0), w32(0), w32(off), nm]));
    off += h.length + nm.length + d.length;
  }
  const cd = Buffer.concat(cen);
  return Buffer.concat([...parts, cd, w32(0x06054b50), w16(0), w16(0), w16(files.length), w16(files.length), w32(cd.length), w32(off), w16(0)]);
}

/* ---------- lettura ---------- */
export function readZip(input, limits = LIMITS) {
  const L = { ...LIMITS, ...limits }, buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const bad = (m) => { throw new ZipError(m); };
  if (buf.length > L.zipBytes) bad(`il file .zip pesa troppo (${buf.length} byte, al massimo ${L.zipBytes})`);
  if (buf.length < 22) bad("non è un file .zip (troppo corto)");
  /* fine dell'archivio: l'unica firma il cui commento arriva esattamente a fine file (non si fa ingannare da una firma finta nel commento) */
  let eocd = -1;
  for (let p = buf.length - 22; p >= Math.max(0, buf.length - 22 - 65535); p--) {
    if (buf.readUInt32LE(p) === 0x06054b50 && p + 22 + buf.readUInt16LE(p + 20) === buf.length) { eocd = p; break; }
  }
  if (eocd < 0) bad("non è un file .zip (manca la fine dell'archivio)");
  const disk = buf.readUInt16LE(eocd + 4), cdDisk = buf.readUInt16LE(eocd + 6), nHere = buf.readUInt16LE(eocd + 8), n = buf.readUInt16LE(eocd + 10), cdSize = buf.readUInt32LE(eocd + 12), cdOff = buf.readUInt32LE(eocd + 16);
  if (disk || cdDisk || nHere !== n) bad("archivio su più dischi: non ammesso");
  if (n === 0xFFFF || cdSize === 0xFFFFFFFF || cdOff === 0xFFFFFFFF) bad("ZIP64: non ammesso");
  if (n > L.files) bad(`troppi file nel pacchetto (${n}, al massimo ${L.files})`);
  if (n === 0) bad("pacchetto vuoto");
  if (cdOff + cdSize > eocd) bad("elenco centrale fuori posto");

  const out = [], seen = new Set(), ranges = [];
  let p = cdOff, total = 0, packed = 0;
  for (let i = 0; i < n; i++) {
    if (p + 46 > cdOff + cdSize || buf.readUInt32LE(p) !== 0x02014b50) bad("elenco centrale rovinato");
    const flags = buf.readUInt16LE(p + 8), method = buf.readUInt16LE(p + 10), crc = buf.readUInt32LE(p + 16), csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24);
    const nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), lho = buf.readUInt32LE(p + 42);
    if (nl > L.nameBytes) bad("nome di file troppo lungo");
    if (p + 46 + nl + el + cl > cdOff + cdSize) bad("elenco centrale rovinato");
    const rawName = buf.subarray(p + 46, p + 46 + nl);
    p += 46 + nl + el + cl;
    let name;
    try { name = new TextDecoder("utf-8", { fatal: true }).decode(rawName); } catch (e) { bad("nome di file non valido (non è UTF-8)"); }
    const why = badName(name); if (why) bad(`nome non ammesso «${name.replace(/\p{C}/gu, "?")}»: ${why}`);
    const key = name.normalize("NFC").toLowerCase();
    if (seen.has(key)) bad(`nome doppio nel pacchetto: «${name}»`);
    seen.add(key);
    if (flags & 1) bad(`«${name}» è cifrato`);
    if (method !== 0 && method !== 8) bad(`«${name}»: metodo di compressione ${method} non ammesso (solo store e deflate)`);
    if (csize === 0xFFFFFFFF || usize === 0xFFFFFFFF || lho === 0xFFFFFFFF) bad("ZIP64: non ammesso");
    if (usize > L.fileBytes) bad(`«${name}» è oltre il limite (${usize} byte, al massimo ${L.fileBytes})`);
    total += usize; packed += csize;
    if (total > L.totalBytes) bad(`il pacchetto decompresso supera ${L.totalBytes} byte`);
    if (method === 0 && csize !== usize) bad(`«${name}»: dimensioni incoerenti`);
    if (method === 8 && usize > L.ratioFrom && usize > csize * L.ratio) bad(`«${name}»: rapporto di compressione sospetto (${csize} → ${usize} byte)`);
    /* intestazione locale: deve dire le stesse cose dell'elenco centrale */
    if (lho + 30 > cdOff || buf.readUInt32LE(lho) !== 0x04034b50) bad(`«${name}»: intestazione locale non valida`);
    const lnl = buf.readUInt16LE(lho + 26), lel = buf.readUInt16LE(lho + 28), start = lho + 30 + lnl + lel, end = start + csize;
    if (buf.readUInt16LE(lho + 8) !== method || lnl !== nl || !buf.subarray(lho + 30, lho + 30 + lnl).equals(rawName)) bad(`«${name}»: intestazione locale diversa dall'elenco`);
    if (end > cdOff) bad(`«${name}»: i dati escono dal file`);
    ranges.push([lho, end, name]);
    let data;
    if (method === 0) data = Buffer.from(buf.subarray(start, end));
    else {
      try { data = zlib.inflateRawSync(buf.subarray(start, end), { maxOutputLength: Math.max(1, usize) }); }
      catch (e) { bad(`«${name}»: dati compressi non validi o più grandi del dichiarato`); }
    }
    if (data.length !== usize) bad(`«${name}»: la dimensione vera (${data.length}) non è quella dichiarata (${usize})`);
    if (crc32(data) !== crc) bad(`«${name}»: CRC32 errato`);
    out.push({ name, data, method });
  }
  if (total > 0 && total > packed * L.ratio && total > L.ratioFrom * 16) bad("rapporto di compressione sospetto sull'insieme del pacchetto");
  ranges.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < ranges.length; i++) if (ranges[i][0] < ranges[i - 1][1]) bad(`«${ranges[i][2]}» e «${ranges[i - 1][2]}» si sovrappongono nel file`);
  return out;
}
