/* ===== màndarínō · codici dei sigilli di gratitudine: formato e verifica della firma (funzioni pure, senza pagina: le
   prove in Node le usano così come sono, tools/seal-issue.mjs le usa per scrivere i codici).
   Codice: MDS1.<payload>.<firma>, in base64url. Il payload è il testo «1.<kid>.<livello>.<anno>.<numero>»: versione, chiave,
   livello (1 Sostegno, 2 Cultura, 3 Custodire), anno dell'edizione, numero progressivo. Nessun dato personale.
   Firma: ECDSA P-256 con SHA-256, nella forma «grezza» r‖s di 64 byte che vuole WebCrypto (tools/seal-issue.mjs firma con
   dsaEncoding: 'ieee-p1363'). La chiave pubblica sta in MD_CONFIG.SEAL_PUBKEYS ({ kid, jwk }); quella privata solo sul
   computer dell'autore. Un'app offline non può verificare un pagamento: verifica soltanto che l'autore abbia firmato. ===== */
var MDSeal = (function () {
  var PREFIX = "MDS1", LEVELS = { 1: 1, 2: 1, 3: 1 };
  function b64u(bytes) { var s = ""; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function unb64u(s) {
    if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new Error("b64");
    s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
    var bin = atob(s), out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out;
  }
  function utf8(s) { return new TextEncoder().encode(s); }
  /* la forma del codice: { v, kid, lvl, year, num, payload (byte), sig (byte) } oppure un errore con il motivo */
  function parse(code) {
    var c = String(code || "").trim().replace(/\s+/g, "");
    var m = /#seal=(.+)$/.exec(c); if (m) c = decodeURIComponent(m[1]);
    var parts = c.split(".");
    if (parts.length !== 3 || parts[0] !== PREFIX) return { err: "format" };
    var p, sig;
    try { p = new TextDecoder().decode(unb64u(parts[1])); sig = unb64u(parts[2]); } catch (e) { return { err: "format" }; }
    var f = p.split(".");
    if (f.length !== 5 || f[0] !== "1") return { err: "format" };
    var lvl = +f[2], year = +f[3], num = +f[4];
    if (!LEVELS[lvl]) return { err: "level" };
    if (!(year >= 2025 && year <= 2200) || !(num >= 1 && num <= 999999) || String(num) !== f[4] || !/^[A-Za-z0-9_-]{1,16}$/.test(f[1])) return { err: "format" };
    if (sig.length !== 64) return { err: "sig" };   /* una firma DER (70-72 byte) non è la forma grezza */
    return { v: 1, kid: f[1], lvl: lvl, year: year, num: num, payload: utf8(p), sig: sig, id: lvl + "-" + year + "-" + num, code: c };
  }
  function make(kid, lvl, year, num) { return "1." + kid + "." + lvl + "." + year + "." + num; }
  function encode(payloadText, sig64) { return PREFIX + "." + b64u(utf8(payloadText)) + "." + b64u(sig64); }
  /* verifica: Promise<{ ok, err?, seal? }>. keys = [{ kid, jwk }] */
  function verify(code, keys, subtle) {
    var s = parse(code); if (s.err) return Promise.resolve({ ok: false, err: s.err });
    var k = (keys || []).filter(function (x) { return x && x.kid === s.kid; })[0];
    if (!k) return Promise.resolve({ ok: false, err: "kid" });
    subtle = subtle || (typeof crypto !== "undefined" && crypto.subtle);
    if (!subtle) return Promise.resolve({ ok: false, err: "nocrypto" });
    return subtle.importKey("jwk", k.jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"])
      .then(function (key) { return subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, s.sig, s.payload); })
      .then(function (ok) { return ok ? { ok: true, seal: { id: s.id, kid: s.kid, lvl: s.lvl, year: s.year, num: s.num, code: s.code } } : { ok: false, err: "sig" }; },
            function () { return { ok: false, err: "sig" }; });
  }
  return { PREFIX: PREFIX, parse: parse, make: make, encode: encode, verify: verify, b64u: b64u, unb64u: unb64u };
})();
