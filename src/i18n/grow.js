/* ===== màndarínō · testi del pop-up di sblocco (ui/grow.js), nelle due lingue dell'interfaccia.
   Si caricano al primo uso di CP.unlockPop (tools/build.mjs, LAZYMOD). Le chiavi it e zh devono essere le stesse (tools/unit.mjs). ===== */
Object.assign(I18N.it, {
  "grow.popT": "Hai sbloccato «{n}»!",
  "grow.popSub": "Con {xp} punti guadagnati studiando, l'app si apre un po' di più. Questo lo hai fatto tu.",
  "grow.popNext": "Prossima sorpresa: «{n}» a {xp} punti. Te ne mancano {m}.",
  "grow.popNextLs": "Prossima sorpresa: «{n}» dopo {ls} lezioni superate (ora: {have}).",
  "grow.popDone": "Hai aperto le schede principali. Gli strumenti di Frasi si aprono man mano che superi le lezioni.",
  "grow.popMore": "E c'è altro: puoi collegare Pleco e Anki, e mettere un widget sulla Home. Lo trovi in ⚙️.",
  "grow.popGo": "Provala adesso",
  "grow.popLater": "Più tardi",
  "grow.popWhere": "Puoi rivedere tutto in ⚙️ → Studio → Livello e schede."
});
Object.assign(I18N.zh, {
  "grow.popT": "已开放“{n}”！",
  "grow.popSub": "你学习赚到了 {xp} 积分，应用又多打开了一点。这是你自己做到的。",
  "grow.popNext": "下一个惊喜：“{n}”，{xp} 积分开放。还差 {m} 分。",
  "grow.popNextLs": "下一个惊喜：“{n}”，通过 {ls} 课后开放（现在：{have}）。",
  "grow.popDone": "主要栏目都已开放。随着你通过课程，句子工具会陆续打开。",
  "grow.popMore": "还有更多：可以连接 Pleco 和 Anki，也可以在主屏幕放一个小组件。在 ⚙️ 里找。",
  "grow.popGo": "马上试试",
  "grow.popLater": "稍后",
  "grow.popWhere": "可在 ⚙️ → 学习 → 水平与栏目 里随时查看。"
});
