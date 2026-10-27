/* màndarínō · titoli facoltativi dei sigilli di gratitudine (ui/seals.js), in un solo punto. Tre forme per ogni titolo:
   m (maschile), f (femminile), n (senza titolo: è il valore predefinito e resta vuoto, così nessun testo dipende dal
   genere). In cinese il problema non si pone: una sola forma, x. Ausiliare: tg(chiave, forma) → testo, con ripiego sulla
   forma «senza titolo» se quella scelta manca. Nomi cinesi da far rileggere a un madrelingua. */
var I18N_TITLES = {
  it: {
    "seal.t1": { m: "Compagno", f: "Compagna", n: "" },
    "seal.t2": { m: "Sinologo", f: "Sinologa", n: "" },
    "seal.t2it": { m: "Italianista", f: "Italianista", n: "" },   /* corso di italiano: il pubblico è cinese */
    "seal.t3": { m: "Custode", f: "Custode", n: "" }
  },
  zh: {
    "seal.t1": { x: "同行者" },
    "seal.t2": { x: "汉学家" },
    "seal.t2it": { x: "意大利学家" },
    "seal.t3": { x: "守护者" }
  }
};
function tg(key, gram) {
  var L = I18N_TITLES[typeof LANG === "string" && I18N_TITLES[LANG] ? LANG : "it"], f = L[key];
  if (!f) return "";
  if (f.x != null) return f.x;
  return (f[gram] != null ? f[gram] : f.n) || "";
}
