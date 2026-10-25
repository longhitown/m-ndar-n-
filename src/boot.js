/* màndarínō · avvio. Gira per primo nel <body>: memorizza la pagina com'era (per la copia scaricabile, CP.snapshot)
   e prepara i registri che i file di dati riempiono (SECTIONS.push, DIALOGS.push). */
(function(){var cs=document.currentScript,s="",c;for(c=document.body.firstElementChild;c&&c!==cs;c=c.nextElementSibling)s+=c.outerHTML;window.__PRISTINE={head:document.head?document.head.innerHTML:"",body:s,lang:document.documentElement.getAttribute("lang")||"it"};})();
var SECTIONS = [], DIALOGS = [];
