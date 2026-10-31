#!/usr/bin/env python3
"""màndarínō · controllo dei file per Anki con la libreria vera di Anki (strumento di sviluppo, non gira nell'app né in CI).

Legge uno o più file esportati dall'app (⚙️ → Dati e sincronizzazione → Anki: porta le tue parole), chiede ad Anki come
interpreta le intestazioni (separatore, HTML, colonna del guid e dei tag, nomi delle colonne, mazzo), li importa in una
raccolta temporanea con un tipo di nota a 5 campi e li reimporta: la seconda volta non deve nascere nessuna nota nuova.

Uso:   python3 -m venv /tmp/ankienv && /tmp/ankienv/bin/pip install anki
       /tmp/ankienv/bin/python tools/anki-check.py mandarino-anki-all-AAAAMMGG.txt [altri.txt]
Verificato con anki 26.09.3 (ottobre 2026): 6385 note del corso di cinese e 4780 del corso di italiano, reimportazione
senza doppioni.
"""
import sys, os, tempfile
from anki.collection import Collection
from anki.import_export_pb2 import ImportCsvRequest, CsvMetadata
d = tempfile.mkdtemp(); col = Collection(os.path.join(d, "t.anki2"))
# un tipo di nota con 5 campi, come lo creerebbe chi studia
mm = col.models; m = mm.new("màndarínō")
for f in ["Vocabolo", "Pinyin", "Traduzione", "Frase", "Traduzione frase"]: mm.add_field(m, mm.new_field(f))
t = mm.new_template("Carta"); t["qfmt"] = "{{Vocabolo}}"; t["afmt"] = "{{FrontSide}}<hr>{{Pinyin}}<br>{{Traduzione}}"; mm.add_template(m, t); mm.add(m)
m = mm.by_name("màndarínō")
for path in sys.argv[1:]:
    md = col.get_csv_metadata(path=path, delimiter=None)
    print(os.path.basename(path), "| delim", md.delimiter, "| html", md.is_html, "| guid col", md.guid_column, "| tags col", md.tags_column, "| cols", list(md.column_labels), "| deck", md.deck_name if md.HasField("deck_name") else md.deck_id)
    md.ClearField("global_notetype"); md.global_notetype.id = m["id"]
    fm = md.global_notetype.field_columns; del fm[:]; fm.extend([2, 3, 4, 5, 6])
    req = ImportCsvRequest(path=path, metadata=md)
    out = col.import_csv(req)
    log = out.log
    print("  nuove", len(log.new), "aggiornate", len(log.updated), "doppioni", len(log.duplicate), "conflitti", len(log.conflicting), "vuote", len(log.empty_first_field))
    out2 = col.import_csv(ImportCsvRequest(path=path, metadata=md))
    print("  reimport: nuove", len(out2.log.new), "aggiornate", len(out2.log.updated), "invariate", len(out2.log.duplicate) + len(getattr(out2.log, "first_field_match", [])))
nid = col.find_notes("银行")[:1]
if nid:
    n = col.get_note(nid[0]); print("  esempio:", dict(n.items()), n.tags, n.guid)
print("note totali", col.note_count())
col.close()
