# màndarínō · che cosa vale per che cosa

| Parte | Dove | Licenza | Testo |
|---|---|---|---|
| Codice dell'app e degli strumenti | `src/` (escluso `src/data/` e `src/audio/music/`), `tools/`, `android/` | MIT | [LICENSE](LICENSE) |
| Contenuti didattici: vocabolario curato (pinyin e significati italiani), frasi d'esempio, lezioni, dialoghi, esercizi, corso di italiano | `src/data/` (salvo le eccezioni sotto) | CC BY 4.0 | [LICENZE/CONTENUTI.txt](LICENZE/CONTENUTI.txt) |
| Musica: 22 brani originali | `src/audio/music/` | CC BY 4.0 | [LICENZE/MUSICA.txt](LICENZE/MUSICA.txt) |
| Parti di altri | elencate una per una | la loro | [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md), `LICENZE/` |

© 2026 Claudio Longhitano. Per citare l'app basta scrivere «màndarínō, di Claudio Longhitano», con un link al
repository.

## Gli strumenti che ho usato

Ho costruito màndarínō con l'aiuto di Claude (Anthropic), un assistente di intelligenza artificiale. Io decido che cosa
deve fare l'app e per chi; lui scrive buona parte del codice, dei testi e della musica, e insieme ci correggiamo. Gli
errori rimasti sono di tutti e due, quelli simpatici soprattutto suoi. Lo dico perché mi sembra giusto che tu lo sappia,
e perché in molti paesi la tutela di ciò che produce un'IA è ancora incerta: le licenze qui sopra dicono comunque come
voglio che tutto venga usato.

## Eccezioni dentro `src/data/`

Questi file hanno la licenza della loro fonte.

| File | Fonte | Licenza |
|---|---|---|
| `strokes.js` | Make Me a Hanzi | Arphic Public License |
| `levels.js`, `freq.js` | complete-hsk-vocabulary | MIT |
| `wiki/zh-it.txt` | wikidict-it, dati di Wikidata | CC0 |
| `it/lexicon.js` | genere, plurale e forme ricavati da Morph-it! | LGPL, una delle due licenze di Morph-it! |

## Contributi

Se mi proponi una correzione o una parola (dall'app, con una issue o per e-mail), accetti che venga pubblicata con la
licenza dei contenuti (CC BY 4.0) o, se è codice, con la MIT. Per i dettagli vedi [CONTRIBUTING.md](CONTRIBUTING.md).
