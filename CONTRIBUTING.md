# Contribuire a màndarínō · 如何参与

[Italiano](#italiano) · [中文](#中文)

## Italiano

màndarínō è fatta per chi studia, e chi studia è la persona migliore per accorgersi di un errore. **Non serve saper
programmare.**

### Che cosa puoi fare senza programmare

| Che cosa | Come |
|---|---|
| **Segnalare un pinyin o un tono sbagliato** | Nell'app: tocca la parola e poi «✏️ Correggi o segnala», oppure ⚙️ → Dati e privacy → Contributi. Oppure una issue «Correzione». |
| **Rileggere le frasi d'esempio** | Se una frase suona innaturale o la traduzione italiana è sbagliata: «✏️ Correggi o segnala», oppure una issue «Correzione». |
| **Proporre una parola nuova** | ⚙️ → Dati e privacy → Contributi → ➕ Parola nuova, oppure una issue «Parola nuova». |
| **Rileggere il cinese del corso di italiano** | Per madrelingua cinesi: le spiegazioni e le traduzioni del corso 意大利语. Una issue «Traduzione». |
| **Proporre una traduzione nel Laboratorio** | Quando il laboratorio dice «non so ancora»: il pulsante 🈯 accanto alla frase. |
| **Dire che cosa è difficile** | Una issue normale, o una e-mail: anche «non ho capito come si fa X» è un contributo. |

I contributi fatti nell'app restano sul tuo telefono finché non li mandi tu, con il canale che preferisci.

### Rileggere un campione di frasi (madrelingua cinesi)

Se il cinese è la tua lingua, il contributo più prezioso è rileggere un campione di circa 300 frasi: per ognuna basta
✓ / ~ / ✗ e, se serve, una proposta. Il modulo e il flusso sono in [docs/rilettura.md](docs/rilettura.md); chiedilo a
`mandarinoapp@gmail.com`.

### Canali

- **Dall'app, senza account:** ⚙️ → Dati e privacy → Contributi → condividi (WeChat, e-mail, ecc.), e-mail, file `.json`
  o GitHub. L'app prepara un piccolo file `mandarino-contrib/1` con le tue proposte e nient'altro.
- **GitHub Issues:** scegli un modello (Correzione, Parola nuova, Traduzione). Una issue con dentro il file dell'app viene
  controllata in automatico da `.github/workflows/contrib.yml`, che risponde con un riepilogo.
- **GitHub Discussions:** per domande e idee, se sono attive nel repository.
- **E-mail:** `mandarinoapp@gmail.com` (lo stesso indirizzo di `src/config.js`).

### Nickname e Crediti

Puoi firmare con un nickname. Se spunti «Voglio comparire nei Crediti», quando almeno una tua proposta viene accolta il
nickname entra in [CONTRIBUTORS.md](CONTRIBUTORS.md) e nel foglio Crediti dell'app. Senza la spunta il nickname serve
solo a chi rilegge. Non chiediamo mai nome vero, e-mail o altri dati.

### Licenza dei contributi

Mandando un contributo accetti che entri in màndarínō con le licenze del progetto: i **contenuti** (parole, frasi,
traduzioni, spiegazioni) con **CC BY 4.0**, il **codice** con **MIT**. Vedi [NOTICE.md](NOTICE.md). Non copiare testi
da fonti con licenze incompatibili (per esempio Wikipedia o CC-CEDICT, che sono «share-alike»): scrivi con parole tue.

### Per chi programma

- Prima di tutto: `npm ci`, poi `npm test` (prove unitarie, build, e2e, ux-audit). Struttura: [docs/ARCHITETTURA.md](docs/ARCHITETTURA.md).
- I vincoli del progetto: tutto offline, nessuna richiesta di rete automatica, niente tracciamento, nessuna dipendenza
  nuova a runtime, due lingue d'interfaccia (italiano e cinese), ogni testo nuovo passa da `t()`.
- Le chiavi dei progressi (`hz`) e i nomi delle chiavi `cp-*` non cambiano mai. Una chiave nuova si chiama `cp-…-v1` e ha
  una regola di unione in `src/core/store.js`.
- Un commit per cambiamento, messaggio in italiano.
- **Etichetta `good first issue`:** chi gestisce il repository la mette sulle issue piccole e ben definite (una
  correzione di dati, un testo, una prova in più). Sono il punto di partenza consigliato.

### Etichette

| Etichetta | Significato |
|---|---|
| `correzione` | un dato sbagliato (pinyin, tono, traduzione, frase) |
| `parola-nuova` | una voce da aggiungere |
| `traduzione` | il cinese del corso di italiano, o una traduzione del laboratorio |
| `contributo` | una patch arrivata dall'app (la mette l'Action) |
| `applica` | chi gestisce il repository la aggiunge per applicare la patch: si apre una pull request |
| `good first issue` | adatta a chi inizia |

## 中文

màndarínō 为学习者而做，而学习者最容易发现错误。**不需要会编程。**

### 不会编程也能做的事

| 做什么 | 怎么做 |
|---|---|
| **报告拼音或声调错误** | 在应用里点开词语，再点“✏️ 更正或报告”，或打开 ⚙️ → 数据和隐私 → 贡献。也可以在 GitHub 上开一个“更正”issue。 |
| **校对例句** | 句子不自然或意大利语翻译有误：“✏️ 更正或报告”，或“更正”issue。 |
| **提议新词** | ⚙️ → 数据和隐私 → 贡献 → ➕ 新词，或“新词”issue。 |
| **校对意大利语课程里的中文** | 欢迎母语为中文的朋友校对意大利语课程的讲解和翻译。请开一个“翻译”issue。 |
| **告诉我们哪里难用** | 普通 issue 或电子邮件都可以：“我不知道怎么做 X”也是贡献。 |

在应用里做的贡献会保存在你的手机上，直到你自己选择方式发送。

### 校对一组句子（中文母语者）

如果中文是你的母语，最有帮助的是校对一份约 300 句的样本：每句只要标 ✓ / ~ / ✗，需要时写出更好的说法。表格和流程见 [docs/rilettura.md](docs/rilettura.md)（意大利语）；可以写信到 `mandarinoapp@gmail.com` 索取。

### 渠道

- **在应用里，无需账号：** ⚙️ → 数据和隐私 → 贡献 → 分享（微信、电子邮件等）、电子邮件、`.json` 文件或 GitHub。
- **GitHub Issues：** 选择模板（更正、新词、翻译）。
- **电子邮件：** `mandarinoapp@gmail.com`。

### 昵称和致谢

你可以用昵称署名。如果勾选“我愿意用这个昵称出现在致谢中”，当你至少有一条建议被采纳时，昵称会出现在
[CONTRIBUTORS.md](CONTRIBUTORS.md) 和应用的致谢页面。我们从不索要真实姓名、电子邮件或其他个人信息。

### 贡献的许可

提交贡献即表示你同意它以本项目的许可加入 màndarínō：**内容**（词语、句子、翻译、讲解）采用 **CC BY 4.0**，**代码**采用
**MIT**。请不要复制许可不兼容的文字（例如维基百科或 CC-CEDICT）：请用自己的话写。

### 标签

`good first issue` 表示适合新手的小任务，是推荐的起点。
