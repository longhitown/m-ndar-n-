import assert from "node:assert/strict";
import { syllableNumToMark, typedSyllables, comparePinyin, compareIt, normalizeIt, stripAccents } from "./digitazione.mjs";

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("✓ " + name); };

t("numeri di tono → accenti", () => {
  const cases = { ni3: "nǐ", hao3: "hǎo", ma1: "mā", lv4: "lǜ", "nu:3": "nǚ", liu2: "liú", dui4: "duì", zhong1: "zhōng", xue2: "xué", ou3: "ǒu", you3: "yǒu", jiu3: "jiǔ", gui4: "guì", ma5: "ma", ma: "ma", xiong2: "xióng" };
  for (const [k, v] of Object.entries(cases)) assert.equal(syllableNumToMark(k), v, k);
});
t("sillabe digitate", () => {
  assert.deepEqual(typedSyllables("ni3hao3"), ["nǐ", "hǎo"]);
  assert.deepEqual(typedSyllables("ni3 hao3"), ["nǐ", "hǎo"]);
  assert.deepEqual(typedSyllables("xi'an"), ["xi", "an"]);
  assert.deepEqual(typedSyllables("péng.you"), ["péng", "you"]);
});
t("pinyin: esatto con numeri, accenti, maiuscole e separatori diversi", () => {
  for (const x of ["ni3hao3", "nǐhǎo", "Ni3 Hao3", "nǐ hǎo", "nǐ.hǎo"]) assert.equal(comparePinyin(x, "nǐ.hǎo"), "esatto", x);
  assert.equal(comparePinyin("peng2you5", "péng.you"), "esatto");
  assert.equal(comparePinyin("peng2you", "péng.you"), "esatto");
  assert.equal(comparePinyin("xi1an1", "xī'ān"), "esatto");
  assert.equal(comparePinyin("lv4", "lǜ"), "esatto");
});
t("pinyin: senza toni, toni sbagliati, sbagliato", () => {
  assert.equal(comparePinyin("nihao", "nǐ.hǎo"), "senza-toni");
  assert.equal(comparePinyin("ni hao", "nǐ.hǎo"), "senza-toni");
  assert.equal(comparePinyin("ni2hao3", "nǐ.hǎo"), "toni-sbagliati");
  assert.equal(comparePinyin("nǐhǎo", "nǐ.hǎo"), "esatto");
  assert.equal(comparePinyin("nihoa", "nǐ.hǎo"), "sbagliato");
  assert.equal(comparePinyin("ni3", "nǐ.hǎo"), "sbagliato");
  assert.equal(comparePinyin("ma1", "mā"), "esatto");
  assert.equal(comparePinyin("ma", "mā"), "senza-toni");
  assert.equal(comparePinyin("ma3", "mā"), "toni-sbagliati");
});
t("italiano: normalizzazione", () => {
  assert.equal(normalizeIt("  Un’amica!  "), "un'amica");
  assert.equal(stripAccents("città"), "citta");
});
t("italiano: esatto, accento, quasi, sbagliato, alternative", () => {
  assert.equal(compareIt("città", "città"), "esatto");
  assert.equal(compareIt("citta", "città"), "accento");
  assert.equal(compareIt("Citta.", "città"), "accento");
  assert.equal(compareIt("bichiere", "bicchiere"), "quasi");
  assert.equal(compareIt("cità", "città"), "sbagliato"); /* parole corte: niente tolleranza ai refusi */
  assert.equal(compareIt("cane", "gatto"), "sbagliato");
  assert.equal(compareIt("me", "io, me"), "esatto");
  assert.equal(compareIt("salve", "buongiorno / salve"), "esatto");
  assert.equal(compareIt("un'amica", "un’amica"), "esatto");
  assert.equal(compareIt("sul", "su"), "sbagliato");
  assert.equal(compareIt("", "ciao"), "sbagliato");
});
console.log("\n" + n + " gruppi di prove passati");
