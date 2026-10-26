#!/usr/bin/env python3
"""màndarínō · seconda verifica dell'italiano con il dizionario Hunspell di LibreOffice (it_IT). SOLO SVILUPPO.

Controlla le parole che Morph-it non conferma (tools/morphit-check.mjs --dump file.txt): ogni parola deve essere
riconosciuta dal correttore ortografico. Serve la libreria Python spylls (pip install spylls) e i file
it_IT.dic / it_IT.aff di https://github.com/LibreOffice/dictionaries/tree/master/it_IT (licenza GPL/LGPL/MPL: non
entrano nel repository). Uso: python3 tools/hunspell-check.py cartella/it_IT parole.txt   (esce con 1 se ne manca una)
"""
import sys
from spylls.hunspell import Dictionary

if len(sys.argv) != 3:
    sys.exit("Uso: python3 tools/hunspell-check.py cartella/it_IT parole.txt")
d = Dictionary.from_files(sys.argv[1])
words = [w.strip() for w in open(sys.argv[2], encoding="utf-8") if w.strip()]
bad = [w for w in words if not d.lookup(w)]
print(f"Hunspell: {len(words) - len(bad)} parole su {len(words)} riconosciute.")
for w in bad:
    print("  ✗ " + w)
sys.exit(1 if bad else 0)
