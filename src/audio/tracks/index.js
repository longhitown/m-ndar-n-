/* Catalogo del jukebox: l'ordine in cui le tracce compaiono nel pannello 🎵.
   Per aggiungere una traccia: il brano in audio/music/<id>.ogg, il modulo audio/tracks/<id>.js (come gli altri), mettila in src/index.html
   prima di questo file e aggiungi qui il suo id. Una traccia caricata ma non elencata va in fondo; un id elencato senza file
   viene segnalato in console e in #selftest. */
(function () {
  var CATALOG = ["suzhou", "ascesa", "neon", "drago", "alba", "li", "shanghai", "tempio", "pechino8bit", "studio", "seta", "hainan", "ovest", "metro", "chengdu", "guilin", "taiji", "lanterne", "puer", "calligrafia", "bambu", "biblioteca"];
  var L = CP.audioTracks.list, pos = {};
  CATALOG.forEach(function (id, i) { pos[id] = i; });
  L.sort(function (a, b) { return (pos[a.id] != null ? pos[a.id] : 999) - (pos[b.id] != null ? pos[b.id] : 999); });
  CP.audioTracks.catalog = CATALOG;
  CP.audioTracks.missing = CATALOG.filter(function (id) { return !L.some(function (t) { return t.id === id; }); });
  if (CP.audioTracks.missing.length && window.console) console.warn("Tracce in catalogo senza file:", CP.audioTracks.missing.join(", "));
})();
