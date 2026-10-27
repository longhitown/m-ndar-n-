package it.mandarino.app;

import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Ponte tra la pagina e Android, esposto come window.MandarinoAndroid. Lo usa solo src/pwa/android.js, che con questi
 * metodi ricostruisce le API web standard che la WebView non ha (speechSynthesis, SpeechRecognition, download, share):
 * il resto dell'app non sa di essere dentro un APK.
 * Gli eventi tornano alla pagina come window.__mdEvt(tipo, id, dati).
 */
public class Bridge {
    private final MainActivity act;
    private TextToSpeech tts;
    private volatile boolean ttsReady = false;
    private SpeechRecognizer recognizer;
    private String recId = null, recPending = null;

    Bridge(MainActivity act) {
        this.act = act;
        tts = new TextToSpeech(act.getApplicationContext(), status -> {
            ttsReady = status == TextToSpeech.SUCCESS;
            if (ttsReady) tts.setOnUtteranceProgressListener(new Progress());
            emit("voices", "", ttsReady ? "ok" : "none");
        });
    }

    private void emit(String type, String id, String data) {
        act.js("window.__mdEvt && window.__mdEvt(" + JSONObject.quote(type) + "," + JSONObject.quote(id == null ? "" : id) + "," + JSONObject.quote(data == null ? "" : data) + ")");
    }

    /* ---------------- sintesi vocale ---------------- */

    private class Progress extends UtteranceProgressListener {
        @Override public void onStart(String id) { emit("tts-start", id, ""); }
        @Override public void onDone(String id) { emit("tts-end", id, ""); }
        @Override @Deprecated public void onError(String id) { emit("tts-error", id, "synthesis-failed"); }
        @Override public void onError(String id, int code) { emit("tts-error", id, code == TextToSpeech.ERROR_NETWORK || code == TextToSpeech.ERROR_NETWORK_TIMEOUT ? "network" : "synthesis-failed"); }
        @Override public void onStop(String id, boolean interrupted) { emit("tts-error", id, "interrupted"); }
    }

    @JavascriptInterface
    public boolean ttsReady() { return ttsReady; }

    /** le voci installate: [{name, lang, local}] */
    @JavascriptInterface
    public String ttsVoices() {
        JSONArray out = new JSONArray();
        if (!ttsReady) return out.toString();
        try {
            Set<Voice> vs = tts.getVoices();
            if (vs != null) for (Voice v : vs) {
                if (v.getFeatures() != null && v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                JSONObject o = new JSONObject();
                o.put("name", v.getName());
                o.put("lang", v.getLocale().toLanguageTag());
                o.put("local", !v.isNetworkConnectionRequired());
                out.put(o);
            }
        } catch (JSONException | RuntimeException ignored) { }
        return out.toString();
    }

    /** true se la frase è stata messa in coda; gli eventi arrivano poi come tts-start / tts-end / tts-error */
    @JavascriptInterface
    public boolean ttsSpeak(String id, String text, String lang, String voiceName, float rate, float pitch) {
        if (!ttsReady || text == null) return false;
        try {
            boolean set = false;
            if (voiceName != null && !voiceName.isEmpty()) {
                Set<Voice> vs = tts.getVoices();
                if (vs != null) for (Voice v : vs) if (v.getName().equals(voiceName)) { set = tts.setVoice(v) == TextToSpeech.SUCCESS; break; }
            }
            if (!set) {
                Locale loc = Locale.forLanguageTag(lang == null || lang.isEmpty() ? "zh-CN" : lang);
                int r = tts.setLanguage(loc);
                if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) return false;
            }
            tts.setSpeechRate(rate > 0 ? rate : 1f);
            tts.setPitch(pitch > 0 ? pitch : 1f);
            Bundle p = new Bundle();
            p.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, id);
            return tts.speak(text, TextToSpeech.QUEUE_FLUSH, p, id) == TextToSpeech.SUCCESS;
        } catch (RuntimeException e) {
            return false;
        }
    }

    @JavascriptInterface
    public void ttsCancel() { if (ttsReady) tts.stop(); }

    /** c'è una voce installata per questa lingua? (es. "zh-CN", "it-IT") */
    @JavascriptInterface
    public boolean ttsHasLang(String lang) {
        if (!ttsReady) return false;
        int r = tts.isLanguageAvailable(Locale.forLanguageTag(lang));
        return r >= TextToSpeech.LANG_AVAILABLE;
    }

    /** apre l'installazione delle voci del motore di sintesi (per scaricare la voce cinese o italiana) */
    @JavascriptInterface
    public void ttsInstall() {
        act.runOnUiThread(() -> {
            try {
                Intent i = new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                act.startActivity(i);
            } catch (ActivityNotFoundException e) {
                try { act.startActivity(new Intent("com.android.settings.TTS_SETTINGS").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); }
                catch (ActivityNotFoundException ignored) { }
            }
        });
    }

    /* ---------------- riconoscimento vocale ---------------- */

    @JavascriptInterface
    public boolean srAvailable() { return SpeechRecognizer.isRecognitionAvailable(act); }

    @JavascriptInterface
    public void srStart(final String id, final String lang, final int maxResults) {
        act.runOnUiThread(() -> { recPending = id; act.requestMic(() -> { recPending = null; startRecognizer(id, lang, maxResults); }); });
    }

    private void startRecognizer(String id, String lang, int maxResults) {
        stopRecognizer();
        recId = id;
        try {
            recognizer = SpeechRecognizer.createSpeechRecognizer(act);
            recognizer.setRecognitionListener(new Listener(id));
            Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang == null || lang.isEmpty() ? "zh-CN" : lang);
            i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, Math.max(1, maxResults));
            i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
            i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, act.getPackageName());
            recognizer.startListening(i);
        } catch (RuntimeException e) {
            emit("sr-error", id, "service-not-allowed");
            emit("sr-end", id, "");
            stopRecognizer();
        }
    }

    @JavascriptInterface
    public void srStop(final String id) {
        act.runOnUiThread(() -> {
            if (recognizer != null && id != null && id.equals(recId)) recognizer.stopListening();
        });
    }

    @JavascriptInterface
    public void srAbort(final String id) {
        act.runOnUiThread(() -> {
            if (id != null && id.equals(recId)) { stopRecognizer(); emit("sr-end", id, ""); }
        });
    }

    void micDenied() {
        if (recPending != null) { emit("sr-error", recPending, "not-allowed"); emit("sr-end", recPending, ""); recPending = null; }
    }

    private void stopRecognizer() {
        if (recognizer != null) {
            try { recognizer.cancel(); recognizer.destroy(); } catch (RuntimeException ignored) { }
            recognizer = null;
        }
        recId = null;
    }

    private class Listener implements RecognitionListener {
        private final String id;
        private boolean ended = false;
        Listener(String id) { this.id = id; }
        private void end() {
            if (ended) return;
            ended = true;
            emit("sr-end", id, "");
            if (id.equals(recId)) act.runOnUiThread(Bridge.this::stopRecognizer);
        }
        @Override public void onReadyForSpeech(Bundle b) { emit("sr-start", id, ""); }
        @Override public void onBeginningOfSpeech() { }
        @Override public void onRmsChanged(float v) { }
        @Override public void onBufferReceived(byte[] b) { }
        @Override public void onEndOfSpeech() { }
        @Override public void onPartialResults(Bundle b) { }
        @Override public void onEvent(int t, Bundle b) { }
        @Override public void onResults(Bundle b) {
            ArrayList<String> r = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            float[] conf = b.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES);
            JSONArray out = new JSONArray();
            try {
                if (r != null) for (int i = 0; i < r.size(); i++) {
                    JSONObject o = new JSONObject();
                    o.put("t", r.get(i));
                    o.put("c", conf != null && i < conf.length ? conf[i] : 0);
                    out.put(o);
                }
            } catch (JSONException ignored) { }
            if (out.length() == 0) emit("sr-error", id, "no-speech");
            else emit("sr-result", id, out.toString());
            end();
        }
        @Override public void onError(int code) {
            String e;
            switch (code) {
                case SpeechRecognizer.ERROR_NO_MATCH: case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: e = "no-speech"; break;
                case SpeechRecognizer.ERROR_AUDIO: e = "audio-capture"; break;
                case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: e = "not-allowed"; break;
                case SpeechRecognizer.ERROR_NETWORK: case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: e = "network"; break;
                case SpeechRecognizer.ERROR_CLIENT: e = "aborted"; break;
                case SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED: case SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE: e = "language-not-supported"; break;   /* Android 12+; costanti copiate nel codice, sicure anche prima */
                default: e = "service-not-allowed";
            }
            emit("sr-error", id, e);
            end();
        }
    }

    /* ---------------- file: backup e pacchetti ---------------- */

    /** salva un file. Android 10+: nella cartella Download. Android 8-9: lo apre nel foglio «Condividi». */
    @JavascriptInterface
    public String saveFile(String name, String mime, String base64) {
        String safe = name == null ? "mandarino.json" : name.replaceAll("[\\\\/:*?\"<>|]", "_");
        byte[] data;
        try { data = Base64.decode(base64, Base64.DEFAULT); } catch (IllegalArgumentException e) { return ""; }
        String type = mime == null || mime.isEmpty() ? "application/octet-stream" : mime;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues v = new ContentValues();
                v.put(MediaStore.MediaColumns.DISPLAY_NAME, safe);
                v.put(MediaStore.MediaColumns.MIME_TYPE, type);
                v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                ContentResolver cr = act.getContentResolver();
                Uri uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                if (uri == null) return "";
                try (OutputStream out = cr.openOutputStream(uri)) {
                    if (out == null) return "";
                    out.write(data);
                }
                final String msg = act.getString(R.string.saved, safe);
                act.runOnUiThread(() -> Toast.makeText(act, msg, Toast.LENGTH_LONG).show());
                return "download";
            }
            File dir = new File(act.getCacheDir(), "share");
            if (!dir.isDirectory() && !dir.mkdirs()) return "";
            File f = new File(dir, safe);
            try (FileOutputStream out = new FileOutputStream(f)) { out.write(data); }
            final Uri uri = ShareProvider.uriFor(f);
            act.runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType(type);
                i.putExtra(Intent.EXTRA_STREAM, uri);
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try { act.startActivity(Intent.createChooser(i, act.getString(R.string.share_title))); }
                catch (ActivityNotFoundException e) { Toast.makeText(act, R.string.save_failed, Toast.LENGTH_LONG).show(); }
            });
            return "share";
        } catch (IOException | RuntimeException e) {
            act.runOnUiThread(() -> Toast.makeText(act, R.string.save_failed, Toast.LENGTH_LONG).show());
            return "";
        }
    }

    /** condivide un file (la card del giorno, PNG) con il foglio «Condividi» di Android */
    @JavascriptInterface
    public boolean shareFile(String name, String mime, String base64) {
        String safe = name == null ? "mandarino.png" : name.replaceAll("[^A-Za-z0-9._-]", "_");
        byte[] data;
        try { data = Base64.decode(base64, Base64.DEFAULT); } catch (IllegalArgumentException e) { return false; }
        try {
            File dir = new File(act.getCacheDir(), "share");
            if (!dir.isDirectory() && !dir.mkdirs()) return false;
            File f = new File(dir, safe);
            try (FileOutputStream out = new FileOutputStream(f)) { out.write(data); }
            final Uri uri = ShareProvider.uriFor(f);
            final String type = mime == null || mime.isEmpty() ? "image/png" : mime;
            act.runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType(type);
                i.putExtra(Intent.EXTRA_STREAM, uri);
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try { act.startActivity(Intent.createChooser(i, act.getString(R.string.share_title))); }
                catch (ActivityNotFoundException ignored) { }
            });
            return true;
        } catch (IOException | RuntimeException e) { return false; }
    }

    /** navigator.share: testo verso WeChat, WhatsApp, email… */
    @JavascriptInterface
    public void share(final String title, final String text) {
        act.runOnUiThread(() -> {
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType("text/plain");
            if (title != null && !title.isEmpty()) i.putExtra(Intent.EXTRA_SUBJECT, title);
            i.putExtra(Intent.EXTRA_TEXT, text == null ? "" : text);
            try { act.startActivity(Intent.createChooser(i, act.getString(R.string.share_title))); }
            catch (ActivityNotFoundException ignored) { }
        });
    }

    /* ---------------- sincronizzazione: un file scelto da chi studia ----------------
       Il selettore di sistema mostra anche Google Drive, OneDrive, Dropbox… (i loro «document provider»): il file resta
       nel cloud dell'utente, l'app lo legge e lo riscrive con un permesso persistente. Nessun server, nessun account. */
    private static final ExecutorService IO = Executors.newSingleThreadExecutor();
    private String syncPending;

    @JavascriptInterface
    public void syncPick(final String id, final boolean create) {
        act.runOnUiThread(() -> {
            syncPending = id;
            Intent i = new Intent(create ? Intent.ACTION_CREATE_DOCUMENT : Intent.ACTION_OPEN_DOCUMENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType(create ? "application/json" : "*/*");
            if (create) i.putExtra(Intent.EXTRA_TITLE, "mandarino-sync.json");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
            try { act.startActivityForResult(i, MainActivity.REQ_SYNC); }
            catch (ActivityNotFoundException e) { syncPending = null; emit("sync-pick", id, ""); }
        });
    }

    void syncPicked(Uri uri) {
        String id = syncPending; syncPending = null;
        if (id == null) return;
        if (uri == null) { emit("sync-pick", id, ""); return; }
        try { act.getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION); }
        catch (SecurityException ignored) { }
        emit("sync-pick", id, uri.toString() + "\n" + displayName(uri));
    }

    private String displayName(Uri uri) {
        try (Cursor c = act.getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (c != null && c.moveToFirst()) { String n = c.getString(0); if (n != null) return n; }
        } catch (RuntimeException ignored) { }
        return "mandarino-sync.json";
    }

    /** legge il file in background: "1" + testo, oppure "0" + motivo */
    @JavascriptInterface
    public void syncRead(final String id, final String uri) {
        IO.execute(() -> {
            try (InputStream in = act.getContentResolver().openInputStream(Uri.parse(uri))) {
                if (in == null) throw new IOException("null");
                ByteArrayOutputStream b = new ByteArrayOutputStream();
                byte[] buf = new byte[16384]; int n;
                while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
                emit("sync-read", id, "1" + new String(b.toByteArray(), StandardCharsets.UTF_8));
            } catch (Exception e) { emit("sync-read", id, "0" + e.getClass().getSimpleName()); }
        });
    }

    /** riscrive il file in background ("wt" = tronca; alcuni provider conoscono solo "w") */
    @JavascriptInterface
    public void syncWrite(final String id, final String uri, final String text) {
        IO.execute(() -> {
            byte[] data = (text == null ? "" : text).getBytes(StandardCharsets.UTF_8);
            String err = null;
            for (String mode : new String[]{"wt", "w"}) {
                try (OutputStream out = act.getContentResolver().openOutputStream(Uri.parse(uri), mode)) {
                    if (out == null) throw new IOException("null");
                    out.write(data); err = null; break;
                } catch (Exception e) { err = e.getClass().getSimpleName(); }
            }
            emit("sync-write", id, err == null ? "1" : "0" + err);
        });
    }

    /** il permesso sul file è ancora valido? (si perde se il file viene cancellato o l'app reinstallata) */
    @JavascriptInterface
    public boolean syncHas(String uri) {
        try {
            Uri u = Uri.parse(uri);
            for (android.content.UriPermission p : act.getContentResolver().getPersistedUriPermissions())
                if (p.getUri().equals(u) && p.isReadPermission() && p.isWritePermission()) return true;
        } catch (RuntimeException ignored) { }
        return false;
    }

    /* ---------------- widget «Oggi» ---------------- */

    /** lo stato per il widget (pwa/widget.js): si salva e si ridisegnano i widget sulla schermata Home */
    @JavascriptInterface
    public void setWidgetState(String json) {
        if (json == null || json.length() > 200000) return;
        act.getSharedPreferences(WidgetState.PREFS, android.content.Context.MODE_PRIVATE).edit().putString("widget", json).apply();
        TodayWidget.updateAll(act.getApplicationContext());
    }

    /* ---------------- musica in secondo piano ---------------- */

    /** stato del jukebox: con il secondo piano scelto, la notifica del brano tiene viva la musica a schermo spento */
    @JavascriptInterface
    public void musicNotify(String title, boolean playing, boolean background) {
        android.content.Context c = act.getApplicationContext();
        MusicService.page = new java.lang.ref.WeakReference<>(act);
        if (!background) { MusicService.stop(c); return; }
        MusicService.update(c, title, playing);
    }

    /* ---------------- promemoria ---------------- */

    @JavascriptInterface
    public String getReminder() {
        android.content.SharedPreferences p = Reminder.prefs(act);
        return "{\"on\":" + p.getBoolean("rem_on", false) + ",\"h\":" + p.getInt("rem_h", 20) + ",\"m\":" + p.getInt("rem_m", 0) + ",\"perm\":\"" + notifPerm() + "\"}";
    }

    @JavascriptInterface
    public void setReminder(boolean on, int h, int m) { Reminder.set(act.getApplicationContext(), on, Math.max(0, Math.min(23, h)), Math.max(0, Math.min(59, m))); }

    /** "granted" | "prompt" (Android 13+, da chiedere) | "denied" (notifiche spente per l'app) */
    @JavascriptInterface
    public String notifPerm() {
        android.app.NotificationManager nm = (android.app.NotificationManager) act.getSystemService(android.content.Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 33 && act.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) return "prompt";
        return nm != null && !nm.areNotificationsEnabled() ? "denied" : "granted";
    }

    /** chiede il permesso delle notifiche (Android 13+) nel momento in cui si accende il promemoria */
    @JavascriptInterface
    public void requestNotif(final String id) {
        act.runOnUiThread(() -> act.requestNotif(ok -> emit("notif-perm", id, ok ? "1" : "0")));
    }

    /* ---------------- Pleco ---------------- */

    /** apre una parola nel dizionario Pleco (plecoapi://); false se Pleco non è installato. La chiama solo un gesto di chi
     *  studia, e solo se ha acceso l'opzione in ⚙️ (ui/pleco.js). */
    @JavascriptInterface
    public boolean openPleco(String text) {
        if (text == null || text.trim().isEmpty() || text.length() > 64) return false;
        final Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("plecoapi://x-callback-url/s?q=" + Uri.encode(text.trim())));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (i.resolveActivity(act.getPackageManager()) == null) return false;
        try { act.startActivity(i); return true; } catch (ActivityNotFoundException e) { return false; }
    }

    /* ---------------- aspetto e informazioni ---------------- */

    @JavascriptInterface
    public void setBars(final String css) {
        final int c;
        try { c = Color.parseColor(css); } catch (IllegalArgumentException e) { return; }
        act.runOnUiThread(() -> act.setBars(c));
    }

    @JavascriptInterface
    public String version() { return BuildConfig.VERSION_NAME; }

    void shutdown() {
        try { if (tts != null) { tts.stop(); tts.shutdown(); } } catch (RuntimeException ignored) { }
        stopRecognizer();
    }
}
