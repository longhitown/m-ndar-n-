/* Catalogo del jukebox: l'ordine in cui le tracce compaiono nel pannello 🎵.
   Per aggiungere una traccia: crea audio/tracks/<id>.js (vedi il contratto in audio/synth.js), mettila in src/index.html
   prima di questo file e aggiungi qui il suo id. Una traccia caricata ma non elencata va in fondo; un id elencato senza file
   viene segnalato in console e in #selftest. */
(function () {
  var CATALOG = ["suzhou", "li", "sichuan", "tempio", "shanghai", "alfa", "ovest", "guilin", "neon", "metro", "dumpling", "lofi2", "drago", "taiji", "pioggia", "seta", "pechino8bit", "jazz", "mare", "focus"];
  var L = CP.audioTracks.list, pos = {};
  CATALOG.forEach(function (id, i) { pos[id] = i; });
  L.sort(function (a, b) { return (pos[a.id] != null ? pos[a.id] : 999) - (pos[b.id] != null ? pos[b.id] : 999); });
  CP.audioTracks.catalog = CATALOG;
  CP.audioTracks.missing = CATALOG.filter(function (id) { return !L.some(function (t) { return t.id === id; }); });
  if (CP.audioTracks.missing.length && window.console) console.warn("Tracce in catalogo senza file:", CP.audioTracks.missing.join(", "));
})();
