#!/bin/sh
# màndarínō · schermate dei widget «Oggi» dall'emulatore (solo build di debug): italiano e cinese, tema chiaro e scuro.
# Uso: sh tools/widget-shots.sh <cartella-di-uscita>   (serve adb nel PATH e l'APK di debug già installato)
set -e
OUT="${1:-widget-shots}"; mkdir -p "$OUT"
for night in no yes; do
  adb shell cmd uimode night $night
  for lang in it zh; do
    adb shell am force-stop it.mandarino.app
    adb shell am start -W -n it.mandarino.app/.WidgetPreview --es lang $lang >/dev/null
    sleep 3
    adb exec-out screencap -p > "$OUT/widget-$lang-$( [ $night = yes ] && echo scuro || echo chiaro ).png"
  done
done
adb shell cmd uimode night no
