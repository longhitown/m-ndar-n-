/* ===== màndarínō · codici QR (scrittura), scritti da zero per l'app: modalità alfanumerica e byte, versioni 1-40, correzione L/M.
   Serve al passaggio dei progressi da un telefono all'altro (pwa/qr-transfer.js): i dati vanno in base45 (RFC 9285), che
   usa esattamente i 45 caratteri della modalità alfanumerica, e quindi entrano nel QR con la resa migliore.
   Algoritmo dello standard ISO/IEC 18004: segmento → blocchi con Reed-Solomon su GF(256) → posa a zig-zag → maschera
   con la penalità più bassa. CP.qr.encode(testo, "M") → { size, get(x, y) }; CP.qr.draw(canvas, qr) lo disegna. ===== */
(function () {
  var CP = window.CP;
  var ALNUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
  /* correzione degli errori: indice 0 = L, 1 = M; per versione, codewords di correzione per blocco e numero di blocchi */
  var ECC = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28]
  ];
  var BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49]
  ];
  var FORMAT = [1, 0];   /* bit del livello nel formato: L = 01, M = 00 */
  function rawModules(v) {
    var r = (16 * v + 128) * v + 64;
    if (v >= 2) { var na = Math.floor(v / 7) + 2; r -= (25 * na - 10) * na - 55; if (v >= 7) r -= 36; }
    return r;
  }
  function dataCodewords(v, e) { return Math.floor(rawModules(v) / 8) - ECC[e][v] * BLOCKS[e][v]; }
  function countBits(v) { return v < 10 ? 9 : v < 27 ? 11 : 13; }

  /* ---- Reed-Solomon su GF(256), polinomio 0x11D ---- */
  function mul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 0xFF; }
  function divisor(deg) {
    var r = []; for (var i = 0; i < deg - 1; i++) r.push(0); r.push(1);
    var root = 1;
    for (i = 0; i < deg; i++) {
      for (var j = 0; j < r.length; j++) { r[j] = mul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
      root = mul(root, 0x02);
    }
    return r;
  }
  function remainder(data, div) {
    var r = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ r.shift(); r.push(0);
      div.forEach(function (c, i) { r[i] ^= mul(c, f); });
    });
    return r;
  }

  function encode(text, level) {
    var e = level === "L" ? 0 : 1, raw0 = String(text), i;
    /* modalità alfanumerica quando basta (i fotogrammi del passaggio tra telefoni); altrimenti byte, UTF-8 (minuscole,
       «_», link: i codici dei sigilli di gratitudine) */
    var byteMode = /[^0-9A-Z $%*+\-.\/:]/.test(raw0), s = byteMode ? raw0 : raw0.toUpperCase(), B = byteMode ? new TextEncoder().encode(raw0) : null;
    var cb = function (v) { return byteMode ? (v < 10 ? 8 : 16) : countBits(v); };
    var segBits = byteMode ? 4 + B.length * 8 : 4 + Math.floor(s.length / 2) * 11 + (s.length % 2) * 6, v;
    for (v = 1; v <= 40; v++) if (segBits + cb(v) <= dataCodewords(v, e) * 8) break;
    if (v > 40) throw new Error("testo troppo lungo per un QR");
    /* bit dei dati */
    var bits = [], put = function (val, n) { for (var k = n - 1; k >= 0; k--) bits.push((val >>> k) & 1); };
    if (byteMode) { put(4, 4); put(B.length, cb(v)); for (i = 0; i < B.length; i++) put(B[i], 8); }
    else {
      put(2, 4); put(s.length, cb(v));
      for (i = 0; i + 1 < s.length; i += 2) put(ALNUM.indexOf(s[i]) * 45 + ALNUM.indexOf(s[i + 1]), 11);
      if (s.length % 2) put(ALNUM.indexOf(s[s.length - 1]), 6);
    }
    var cap = dataCodewords(v, e) * 8;
    put(0, Math.min(4, cap - bits.length)); put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = []; for (i = 0; i < bits.length; i += 8) { var by = 0; for (var k = 0; k < 8; k++) by = (by << 1) | bits[i + k]; data.push(by); }
    /* blocchi, correzione, alternanza */
    var nb = BLOCKS[e][v], el = ECC[e][v], raw = Math.floor(rawModules(v) / 8), nShort = nb - raw % nb, shortLen = Math.floor(raw / nb);
    var blocks = [], div = divisor(el), pos = 0;
    for (i = 0; i < nb; i++) {
      var dat = data.slice(pos, pos + shortLen - el + (i < nShort ? 0 : 1)); pos += dat.length;
      var ecc = remainder(dat, div); if (i < nShort) dat.push(-1);
      blocks.push(dat.concat(ecc));
    }
    var all = [];
    for (i = 0; i < blocks[0].length; i++) blocks.forEach(function (b, j) { if (i !== shortLen - el || j >= nShort) all.push(b[i]); });
    return place(v, e, all);
  }

  function place(v, e, cw) {
    var size = v * 4 + 17, M = [], F = [], x, y, i;
    for (y = 0; y < size; y++) { M.push(new Array(size).fill(false)); F.push(new Array(size).fill(false)); }
    var fn = function (x, y, d) { M[y][x] = d; F[y][x] = true; };
    for (i = 0; i < size; i++) { fn(6, i, i % 2 === 0); fn(i, 6, i % 2 === 0); }   /* linee di temporizzazione */
    var finder = function (cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) fn(xx, yy, d !== 2 && d !== 4);
      }
    };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var al = [];
    if (v > 1) {
      var na = Math.floor(v / 7) + 2, step = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (na * 2 - 2)) * 2;
      for (var p = size - 7; al.length < na - 1; p -= step) al.unshift(p);
      al.unshift(6);
    }
    al.forEach(function (ay, a) { al.forEach(function (ax, b) {
      if ((a === 0 && b === 0) || (a === 0 && b === al.length - 1) || (a === al.length - 1 && b === 0)) return;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) fn(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }); });
    var drawFormat = function (mask) {
      var data = FORMAT[e] << 3 | mask, rem = data;
      for (var k = 0; k < 10; k++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var b = (data << 10 | rem) ^ 0x5412, bit = function (j) { return ((b >>> j) & 1) !== 0; };
      for (k = 0; k <= 5; k++) fn(8, k, bit(k));
      fn(8, 7, bit(6)); fn(8, 8, bit(7)); fn(7, 8, bit(8));
      for (k = 9; k < 15; k++) fn(14 - k, 8, bit(k));
      for (k = 0; k < 8; k++) fn(size - 1 - k, 8, bit(k));
      for (k = 8; k < 15; k++) fn(8, size - 15 + k, bit(k));
      fn(8, size - 8, true);
    };
    drawFormat(0);
    if (v >= 7) {
      var rem = v; for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var vb = v << 12 | rem;
      for (i = 0; i < 18; i++) { var bt = ((vb >>> i) & 1) !== 0, a2 = size - 11 + i % 3, b2 = Math.floor(i / 3); fn(a2, b2, bt); fn(b2, a2, bt); }
    }
    /* dati a zig-zag, due colonne alla volta, dal basso a destra */
    var n = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (var j = 0; j < 2; j++) {
        x = right - j; var up = ((right + 1) & 2) === 0; y = up ? size - 1 - vert : vert;
        if (!F[y][x] && n < cw.length * 8) { M[y][x] = ((cw[n >>> 3] >>> (7 - (n & 7))) & 1) !== 0; n++; }
      }
    }
    /* la maschera con la penalità più bassa */
    var MASK = [function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; }, function (x) { return x % 3 === 0; }, function (x, y) { return (x + y) % 3 === 0; },
      function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; }, function (x, y) { return x * y % 2 + x * y % 3 === 0; },
      function (x, y) { return (x * y % 2 + x * y % 3) % 2 === 0; }, function (x, y) { return ((x + y) % 2 + x * y % 3) % 2 === 0; }];
    var apply = function (m) { for (var yy = 0; yy < size; yy++) for (var xx = 0; xx < size; xx++) if (!F[yy][xx] && MASK[m](xx, yy)) M[yy][xx] = !M[yy][xx]; };
    var best = 0, bestP = Infinity;
    for (var m = 0; m < 8; m++) { apply(m); drawFormat(m); var pe = penalty(M, size); if (pe < bestP) { bestP = pe; best = m; } apply(m); }
    apply(best); drawFormat(best);
    return { size: size, version: v, get: function (x, y) { return x >= 0 && y >= 0 && x < size && y < size && M[y][x]; } };
  }
  function penalty(M, size) {
    var p = 0, dark = 0, x, y;
    var lines = function (get) {
      for (var a = 0; a < size; a++) {
        var run = 1, s = "";
        for (var b = 0; b < size; b++) {
          var c = get(a, b); s += c ? "1" : "0"; if (c) dark++;
          if (b > 0) { if (c === get(a, b - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; }
        }
        var w = "0000" + s + "0000", k = -1;
        while ((k = w.indexOf("1011101", k + 1)) >= 0) { if (w.substr(k - 4, 4) === "0000" || w.substr(k + 7, 4) === "0000") p += 40; }
      }
    };
    lines(function (a, b) { return M[a][b]; }); var d1 = dark; dark = 0;
    lines(function (a, b) { return M[b][a]; }); dark = d1;
    for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) { var c0 = M[y][x]; if (c0 === M[y][x + 1] && c0 === M[y + 1][x] && c0 === M[y + 1][x + 1]) p += 3; }
    var tot = size * size; p += (Math.ceil(Math.abs(dark * 20 - tot * 10) / tot) - 1) * 10;
    return p;
  }
  /* disegno su canvas, con il margine bianco di 4 moduli che i lettori si aspettano */
  function draw(cv, q, px) {
    var n = q.size + 8, s = px || Math.max(2, Math.floor(Math.min(cv.clientWidth || 300, 1200) * (window.devicePixelRatio || 1) / n)), x = cv.getContext("2d");
    cv.width = cv.height = n * s;
    x.fillStyle = "#fff"; x.fillRect(0, 0, n * s, n * s); x.fillStyle = "#000";
    for (var yy = 0; yy < q.size; yy++) for (var xx = 0; xx < q.size; xx++) if (q.get(xx, yy)) x.fillRect((xx + 4) * s, (yy + 4) * s, s, s);
  }
  /* base45 (RFC 9285): 2 byte → 3 caratteri alfanumerici */
  var B45 = ALNUM;
  function b45enc(bytes) {
    var out = "";
    for (var i = 0; i + 1 < bytes.length; i += 2) { var n = bytes[i] * 256 + bytes[i + 1]; out += B45[n % 45] + B45[Math.floor(n / 45) % 45] + B45[Math.floor(n / 2025)]; }
    if (bytes.length % 2) { var m = bytes[bytes.length - 1]; out += B45[m % 45] + B45[Math.floor(m / 45)]; }
    return out;
  }
  function b45dec(s) {
    var out = [];
    for (var i = 0; i < s.length; i += 3) {
      var c = B45.indexOf(s[i]), d = B45.indexOf(s[i + 1]), e = i + 2 < s.length ? B45.indexOf(s[i + 2]) : -1;
      if (c < 0 || d < 0) throw new Error("base45");
      if (e < 0) out.push(c + d * 45);
      else { var n = c + d * 45 + e * 2025; out.push(n >> 8, n & 255); }
    }
    return new Uint8Array(out);
  }
  CP.qr = { encode: encode, draw: draw, b45enc: b45enc, b45dec: b45dec };
})();
