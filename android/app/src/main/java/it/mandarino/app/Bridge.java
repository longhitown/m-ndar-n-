package it.mandarino.app;

import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.media.AudioAttributes;
import android.media.AudioManager;
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
    private volatile boolean ttsReady = false, ttsStarting = false;
    /* una richiesta arrivata mentre il motore vocale si riavvia: parte appena è pronto (l'ultima vince, come QUEUE_FLUSH) */
    private String pendId = null;
    private Runnable pendRun = null;
    private SpeechRecognizer recognizer;
    private String recId = null, recPending = null;
    private boolean musicWasMuted = false;

    Bridge(MainActivity act) {
        this.act = act;
        initTts();
    }

    /** (ri)avvia il motore di sintesi. Android può chiudere il servizio vocale quando l'app resta ferma qualche minuto: da quel
     *  momento speak() fallisce per sempre, e la voce restava muta fino al riavvio dell'app. */
    private void initTts() {
        final TextToSpeech old = tts;
        ttsReady = false; ttsStarting = true;
        tts = new TextToSpeech(act.getApplicationContext(), status -> {
            ttsStarting = false;
            ttsReady = status == TextToSpeech.SUCCESS;
            if (ttsReady) {
                tts.setOnUtteranceProgressListener(new Progress());
                try { tts.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build()); } catch (RuntimeException ignored) { }
            }
            emit("voices", "", ttsReady ? "ok" : "none");
            final String id = pendId; final Runnable run = pendRun; pendId = null; pendRun = null;
            if (run != null) { if (ttsReady) run.run(); else emit("tts-error", id, "synthesis-unavailable"); }
        });
        if (old != null) { try { old.stop(); old.shutdown(); } catch (RuntimeException ignored) { } }
    }

    private void retryAfterRestart(String id, Runnable run) {
        if (pendId != null) emit("tts-error", pendId, "interrupted");
        pendId = id; pendRun = run;
        if (!ttsStarting) act.runOnUiThread(this::initTts);
    }

    private void emit(String type, String id, String data) {
        act.js("window.__mdEvt && window.__mdEvt(" + JSONObject.quote(type) + "," + JSONObject.quote(id == null ? "" : id) + "," + JSONObject.quote(data == null ? "" : data) + ")");
    }

    /* ---------------- sintesi vocale ---------------- */

    private class Progress extends UtteranceProgressListener {
        @Override public void onStart(String id) { emit("tts-start", id, ""); }
        @Override public void onDone(String id) { emit("tts-end", id, ""); }
        @Override @Deprecated public void onError(String id) { emit("tts-error", id, "synthesis-failed"); }
        @Override public void onError(String id, int code) { if (code == TextToSpeech.ERROR_SERVICE) ttsReady = false; emit("tts-error", id, code == TextToSpeech.ERROR_NETWORK || code == TextToSpeech.ERROR_NETWORK_TIMEOUT ? "network" : "synthesis-failed"); }
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
    public boolean ttsSpeak(final String id, final String text, final String lang, final String voiceName, final float rate, final float pitch) {
        if (text == null) return false;
        if (!ttsReady) {
            /* il motore non c'è (spento dal sistema): lo si riavvia e la frase parte appena è pronto; gli esiti arrivano come eventi */
            retryAfterRestart(id, () -> { int r = speakNow(id, text, lang, voiceName, rate, pitch); if (r != 1) emit("tts-error", id, r == 0 ? "language-unavailable" : "synthesis-failed"); });
            return true;
        }
        int r = speakNow(id, text, lang, voiceName, rate, pitch);
        if (r == -1) {   /* il motore ha risposto con un errore: probabilmente è morto, lo si riavvia una volta e si riprova */
            ttsReady = false;
            retryAfterRestart(id, () -> { int r2 = speakNow(id, text, lang, voiceName, rate, pitch); if (r2 != 1) emit("tts-error", id, r2 == 0 ? "language-unavailable" : "synthesis-failed"); });
            return true;
        }
        return r == 1;
    }

    /** 1 = in coda, 0 = lingua non disponibile, -1 = il motore non risponde */
    private int speakNow(String id, String text, String lang, String voiceName, float rate, float pitch) {
        try {
            boolean set = false;
            if (voiceName != null && !voiceName.isEmpty()) {
                Set<Voice> vs = tts.getVoices();
                if (vs != null) for (Voice v : vs) if (v.getName().equals(voiceName)) { set = tts.setVoice(v) == TextToSpeech.SUCCESS; break; }
            }
            if (!set) {
                Locale loc = Locale.forLanguageTag(lang == null || lang.isEmpty() ? "zh-CN" : lang);
                int r = tts.setLanguage(loc);
                if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) return 0;
            }
            tts.setSpeechRate(rate > 0 ? rate : 1f);
            tts.setPitch(pitch > 0 ? pitch : 1f);
            Bundle p = new Bundle();
            p.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, id);
            return tts.speak(text, TextToSpeech.QUEUE_FLUSH, p, id) == TextToSpeech.SUCCESS ? 1 : -1;
        } catch (RuntimeException e) {
            return -1;
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

    /**
     * Prova nativa del microfono, senza passare dalla WebView: apre un AudioRecord per ogni sorgente e legge ~250 ms.
     * Dice se è il telefono (fallisce anche qui) o la WebView (qui funziona, getUserMedia no). Dura circa 1,5 s: la pagina la chiama
     * solo dall'autodiagnosi, quando l'apertura normale è già fallita.
     */
    @JavascriptInterface
    @android.annotation.SuppressLint("MissingPermission")   /* il permesso si controlla qui sotto con hasMic(), che lint non riconosce */
    public String micProbe() {
        JSONArray out = new JSONArray();
        if (!act.hasMic()) return "[{\"error\":\"permesso mancante\"}]";
        int[] src = {1, 6, 9, 7, 5};
        String[] nm = {"MIC", "VOICE_RECOGNITION", "UNPROCESSED", "VOICE_COMMUNICATION", "CAMCORDER"};
        for (int k = 0; k < src.length; k++) out.put(probeSource(src[k], nm[k]));
        /* Chromium apre la cattura in «modalità comunicazione» quando il telefono ha l'eco cancellation hardware: si riprova la sorgente
           delle chiamate con la modalità audio di Android portata a MODE_IN_COMMUNICATION (poi ripristinata) e si dice cosa offre il telefono */
        AudioManager am = (AudioManager) act.getSystemService(Context.AUDIO_SERVICE);
        if (am != null) {
            int old = am.getMode();
            try {
                am.setMode(AudioManager.MODE_IN_COMMUNICATION);
                out.put(probeSource(7, "VOICE_COMMUNICATION in MODE_IN_COMMUNICATION"));
            } catch (Throwable e) {
                JSONObject o = new JSONObject();
                try { o.put("source", "VOICE_COMMUNICATION in MODE_IN_COMMUNICATION"); o.put("error", String.valueOf(e)); } catch (JSONException ignore) {}
                out.put(o);
            } finally {
                try { am.setMode(old); } catch (Throwable ignore) {}
            }
        }
        JSONObject fx = new JSONObject();
        try {
            fx.put("source", "EFFETTI HARDWARE");
            fx.put("echoCanceler", android.media.audiofx.AcousticEchoCanceler.isAvailable());
            fx.put("noiseSuppressor", android.media.audiofx.NoiseSuppressor.isAvailable());
            fx.put("autoGain", android.media.audiofx.AutomaticGainControl.isAvailable());
            fx.put("info", true);
        } catch (Throwable e) {
            try { fx.put("error", String.valueOf(e)); } catch (JSONException ignore) {}
        }
        out.put(fx);
        return out.toString();
    }

    /** Apre un AudioRecord con la sorgente data, legge ~250 ms e riporta stato, campioni e picco. */
    @android.annotation.SuppressLint("MissingPermission")
    private JSONObject probeSource(int source, String name) {
        JSONObject o = new JSONObject();
        android.media.AudioRecord ar = null;
        try {
            o.put("source", name);
            int min = android.media.AudioRecord.getMinBufferSize(16000, android.media.AudioFormat.CHANNEL_IN_MONO, android.media.AudioFormat.ENCODING_PCM_16BIT);
            o.put("minBuffer", min);
            if (min <= 0) { o.put("error", "getMinBufferSize=" + min); return o; }
            ar = new android.media.AudioRecord(source, 16000, android.media.AudioFormat.CHANNEL_IN_MONO, android.media.AudioFormat.ENCODING_PCM_16BIT, min * 2);
            o.put("initialized", ar.getState() == android.media.AudioRecord.STATE_INITIALIZED);
            if (ar.getState() == android.media.AudioRecord.STATE_INITIALIZED) {
                ar.startRecording();
                o.put("recording", ar.getRecordingState() == android.media.AudioRecord.RECORDSTATE_RECORDING);
                short[] b = new short[1600];
                long end = System.currentTimeMillis() + 250;
                int total = 0, peak = 0, last = 0;
                while (System.currentTimeMillis() < end) {
                    int n = ar.read(b, 0, b.length);
                    if (n < 0) { last = n; break; }
                    total += n;
                    for (int i = 0; i < n; i++) peak = Math.max(peak, Math.abs((int) b[i]));
                }
                o.put("samples", total);
                o.put("peak", peak);
                if (last < 0) o.put("readError", last);
            }
        } catch (Throwable e) {
            try { o.put("error", String.valueOf(e)); } catch (JSONException ignore) {}
        } finally {
            if (ar != null) { try { ar.stop(); } catch (Throwable ignore) {} try { ar.release(); } catch (Throwable ignore) {} }
        }
        return o;
    }

    /* ---------------- cattura nativa (piano B di getUserMedia) ----------------
       Se la WebView non riesce ad aprire il microfono (NotReadableError), la pagina chiede ad Android di registrare con AudioRecord
       (sorgenti che funzionano: MIC, VOICE_RECOGNITION, CAMCORDER, UNPROCESSED) e riceve i campioni PCM 16 bit mono a 16 kHz come
       eventi «mic-pcm» (base64, blocchi da 20 ms). src/voice/mic.js li trasforma in un MediaStream: il resto dell'app non cambia.
       La stessa cattura può alimentare anche il riconoscimento vocale di sistema (Android 13+, RecognizerIntent.EXTRA_AUDIO_SOURCE):
       così il testo riconosciuto e l'audio registrato vengono dalla STESSA voce (filtro dello scambio linguistico) e il riconoscimento
       non usa un microfono suo, che su alcuni telefoni non sente niente (microfono delle carte). */
    private volatile boolean capRun = false;
    private Thread capThread;
    private volatile String capId = "";
    private volatile boolean capEndpoint = false;
    /* i campioni per il riconoscimento passano da una coda e da un filo a parte: se il riconoscimento non legge (non supporta l'audio nostro),
       la registrazione non si blocca; la coda piena scarta i campioni nuovi */
    private volatile java.util.concurrent.LinkedBlockingQueue<byte[]> pipeQ;
    private ParcelFileDescriptor pipeRead;

    /** Apre un AudioRecord a 16 kHz mono con la prima sorgente che parte; riporta il nome in used[0]. */
    @android.annotation.SuppressLint("MissingPermission")   /* il permesso si controlla in chi lo chiama (hasMic) */
    private android.media.AudioRecord openRecord(String[] used) {
        int[] src = {1, 6, 5, 9};
        String[] nm = {"MIC", "VOICE_RECOGNITION", "CAMCORDER", "UNPROCESSED"};
        int min = android.media.AudioRecord.getMinBufferSize(16000, android.media.AudioFormat.CHANNEL_IN_MONO, android.media.AudioFormat.ENCODING_PCM_16BIT);
        if (min <= 0) return null;
        for (int k = 0; k < src.length; k++) {
            android.media.AudioRecord t = null;
            try {
                t = new android.media.AudioRecord(src[k], 16000, android.media.AudioFormat.CHANNEL_IN_MONO, android.media.AudioFormat.ENCODING_PCM_16BIT, Math.max(min * 2, 6400));
                if (t.getState() == android.media.AudioRecord.STATE_INITIALIZED) {
                    t.startRecording();
                    if (t.getRecordingState() == android.media.AudioRecord.RECORDSTATE_RECORDING) { used[0] = nm[k]; return t; }
                }
            } catch (Throwable ignore) { }
            if (t != null) { try { t.release(); } catch (Throwable ignore) { } }
        }
        return null;
    }

    /** Avvia il filo di cattura. emitPcm: manda i campioni alla pagina; endpoint: decide da sé quando la persona ha finito di parlare. */
    private synchronized String startCapture(final String id, final boolean emitPcm, final boolean endpoint) {
        stopCapture();
        if (!act.hasMic()) return "";
        String[] used = {""};
        final android.media.AudioRecord rec = openRecord(used);
        if (rec == null) return "";
        capRun = true; capId = id; capEndpoint = endpoint;
        capThread = new Thread(() -> {
            short[] b = new short[320];
            byte[] by = new byte[640];
            long t0 = System.currentTimeMillis(), lastVoice = 0;
            double floor = 1e9;
            boolean spoke = false;
            try {
                while (capRun) {
                    int n = rec.read(b, 0, b.length);
                    if (n < 0) break;
                    if (n == 0) continue;
                    double sum = 0;
                    for (int i = 0; i < n; i++) { by[2 * i] = (byte) b[i]; by[2 * i + 1] = (byte) (b[i] >> 8); sum += (double) b[i] * b[i]; }
                    if (emitPcm) emit("mic-pcm", id, Base64.encodeToString(by, 0, n * 2, Base64.NO_WRAP));
                    java.util.concurrent.LinkedBlockingQueue<byte[]> q = pipeQ;
                    if (q != null) q.offer(java.util.Arrays.copyOf(by, n * 2));
                    if (endpoint) {
                        double rms = Math.sqrt(sum / n), now = System.currentTimeMillis();
                        floor = Math.min(floor, Math.max(rms, 1));
                        if (rms > Math.max(250, floor * 3.5)) { spoke = true; lastVoice = (long) now; }
                        if (spoke && now - lastVoice > 900) break;      /* ha parlato e poi tace */
                        if (!spoke && now - t0 > 5000) break;           /* non ha parlato */
                        if (now - t0 > 10000) break;                    /* tetto massimo */
                    }
                }
            } catch (Throwable ignore) {
            } finally {
                try { rec.stop(); } catch (Throwable ignore) { }
                try { rec.release(); } catch (Throwable ignore) { }
                if (endpoint) closePipe();            /* fine del flusso: il riconoscimento chiude e risponde */
                if (emitPcm) emit("mic-end", id, "");
            }
        }, "md-mic");
        capThread.start();
        return used[0];
    }

    private void closePipe() {
        java.util.concurrent.LinkedBlockingQueue<byte[]> q = pipeQ; pipeQ = null;
        if (q != null) { q.clear(); q.offer(new byte[0]); }   /* segnale di fine: il filo chiude il flusso e il riconoscimento risponde */
    }

    private void stopCapture() {
        capRun = false;
        Thread t = capThread;
        if (t != null && t != Thread.currentThread()) {
            try { t.join(400); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }
        closePipe();
    }

    @JavascriptInterface
    public String nativeMicStart(final String id) { return startCapture(id, true, false); }

    /** Ferma la cattura e aspetta (al massimo 0,4 s) che AudioRecord sia rilasciato: chi parte subito dopo trova il microfono libero. */
    @JavascriptInterface
    public void nativeMicStop() { stopCapture(); }

    @JavascriptInterface
    public boolean nativeMicRunning() { return capRun; }

    /** true se il telefono può dare al riconoscimento un audio già pronto (Android 13+). */
    @JavascriptInterface
    public boolean srPipedSupported() { return Build.VERSION.SDK_INT >= 33 && SpeechRecognizer.isRecognitionAvailable(act); }

    /** Collega il riconoscimento vocale alla cattura NATIVA già in corso (stesso audio che si sta registrando). Risponde con eventi sr-* con lo stesso id. */
    @JavascriptInterface
    public boolean nativeSrAttach(final String lang, final int maxResults) {
        if (!capRun || !srPipedSupported()) return false;
        final String id = capId;
        act.runOnUiThread(() -> beginPipedRecognizer(id, lang, maxResults));
        return true;
    }

    /** La registrazione è finita: chiude il flusso verso il riconoscimento, che risponde con il testo. */
    @JavascriptInterface
    public void nativeSrFinish() { closePipe(); }

    /** Riconoscimento vocale con audio nostro: cattura propria (senza mandare campioni alla pagina) e fine parlato deciso qui. */
    @JavascriptInterface
    public void srStartPiped(final String id, final String lang, final int maxResults) {
        if (!srPipedSupported()) { emit("sr-error", id, "service-not-allowed"); emit("sr-end", id, ""); return; }
        act.runOnUiThread(() -> {
            stopRecognizer();
            beginPipedRecognizerThenCapture(id, lang, maxResults);
        });
    }

    private void beginPipedRecognizerThenCapture(String id, String lang, int maxResults) {
        if (startCapture(id, false, true).isEmpty()) { emit("sr-error", id, "audio-capture"); emit("sr-end", id, ""); return; }
        beginPipedRecognizer(id, lang, maxResults);
    }

    private void beginPipedRecognizer(String id, String lang, int maxResults) {
        try {
            ParcelFileDescriptor[] p = ParcelFileDescriptor.createPipe();
            closePipe();
            pipeRead = p[0];
            final java.io.OutputStream os = new ParcelFileDescriptor.AutoCloseOutputStream(p[1]);
            final java.util.concurrent.LinkedBlockingQueue<byte[]> q = new java.util.concurrent.LinkedBlockingQueue<>(250);
            new Thread(() -> {
                try { while (true) { byte[] d = q.take(); if (d.length == 0) break; os.write(d); } } catch (Exception ignore) { }
                finally { try { os.close(); } catch (java.io.IOException ignore) { } }
            }, "md-pipe").start();
            recId = id;
            recognizer = SpeechRecognizer.createSpeechRecognizer(act);
            recognizer.setRecognitionListener(new Listener(id));
            Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang == null || lang.isEmpty() ? "zh-CN" : lang);
            i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, Math.max(1, maxResults));
            i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
            i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, act.getPackageName());
            i.putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE, p[0]);
            i.putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_CHANNEL_COUNT, 1);
            i.putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_ENCODING, android.media.AudioFormat.ENCODING_PCM_16BIT);
            i.putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_SAMPLING_RATE, 16000);
            pipeQ = q;
            recognizer.startListening(i);
        } catch (Throwable e) {
            emit("sr-error", id, "service-not-allowed");
            emit("sr-end", id, "");
            closePipe();
            stopRecognizer();
        }
    }

    /** Stato del microfono lato Android, per l'autodiagnosi: JSON con permesso, modalità audio, registrazioni già in corso e diario dei permessi. */
    @JavascriptInterface
    public String micDiag() {
        JSONObject o = new JSONObject();
        try {
            o.put("model", Build.MANUFACTURER + " " + Build.MODEL);
            o.put("android", Build.VERSION.RELEASE + " (API " + Build.VERSION.SDK_INT + ")");
            o.put("permission", act.hasMic());
            o.put("recognizerBusy", recId != null || recPending != null);
            o.put("recognizerAvailable", SpeechRecognizer.isRecognitionAvailable(act));
            AudioManager am = (AudioManager) act.getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                o.put("micMuted", am.isMicrophoneMute());
                o.put("mode", am.getMode());   /* 0 normale · 1 suoneria · 2 telefonata · 3 chiamata in app */
                if (Build.VERSION.SDK_INT >= 24) {
                    java.util.List<android.media.AudioRecordingConfiguration> cfg = am.getActiveRecordingConfigurations();
                    JSONArray a = new JSONArray();
                    for (android.media.AudioRecordingConfiguration c : cfg) {
                        JSONObject r = new JSONObject();
                        r.put("source", c.getClientAudioSource());
                        if (Build.VERSION.SDK_INT >= 29) r.put("silenced", c.isClientSilenced());
                        a.put(r);
                    }
                    o.put("recordings", a);
                }
            }
            JSONArray ev = new JSONArray();
            for (String s : act.micEvents()) ev.put(s);
            o.put("events", ev);
        } catch (Exception e) {
            try { o.put("error", String.valueOf(e)); } catch (JSONException ignore) {}
        }
        return o.toString();
    }

    @JavascriptInterface
    public void srStart(final String id, final String lang, final int maxResults) {
        act.runOnUiThread(() -> { recPending = id; act.requestMic(() -> { recPending = null; startRecognizer(id, lang, maxResults); }); });
    }

    private void startRecognizer(String id, String lang, int maxResults) {
        final boolean hadOne = recognizer != null;
        stopRecognizer();
        recId = id;
        /* il riconoscitore di sistema ha bisogno di un attimo per liberare il microfono dopo cancel()/destroy(): senza
           questa pausa, un secondo tocco ravvicinato dava «recognizer busy» */
        if (hadOne) { act.getWindow().getDecorView().postDelayed(() -> { if (id.equals(recId)) beginRecognizer(id, lang, maxResults); }, 220); return; }
        beginRecognizer(id, lang, maxResults);
    }

    private void beginRecognizer(String id, String lang, int maxResults) {
        try {
            AudioManager am = (AudioManager) act.getSystemService(Context.AUDIO_SERVICE);
            musicWasMuted = am != null && am.isStreamMute(AudioManager.STREAM_MUSIC);
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
            if (pipeRead != null) { try { pipeRead.close(); } catch (java.io.IOException ignored) { } pipeRead = null; }
            /* su alcuni telefoni il riconoscitore silenzia il volume dei media durante l'ascolto e, se lo si chiude in fretta, non lo
               ripristina: parole, toni e musica restano muti finché non si riavvia l'app. Se prima non era muto, lo si riaccende. */
            act.getWindow().getDecorView().postDelayed(() -> {
                try {
                    AudioManager am = (AudioManager) act.getSystemService(Context.AUDIO_SERVICE);
                    if (recognizer == null && !musicWasMuted && am != null && am.isStreamMute(AudioManager.STREAM_MUSIC)) am.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_UNMUTE, 0);
                } catch (RuntimeException ignored) { }
            }, 800);
        }
        recId = null;
    }

    /** l'app passa in secondo piano: il microfono si libera subito */
    void pause() {
        if (recognizer == null) return;
        final String id = recId;
        stopRecognizer();
        if (id != null) emit("sr-end", id, "");
    }

    private class Listener implements RecognitionListener {
        private final String id;
        private boolean ended = false;
        Listener(String id) { this.id = id; }
        private void end() {
            if (ended) return;
            ended = true;
            if (capEndpoint && id.equals(capId)) capRun = false;   /* riconoscimento finito: la cattura nata per lui si ferma */
            emit("sr-end", id, "");
            /* si ricontrolla l'id sul thread dell'interfaccia: nel frattempo può essere partito un nuovo ascolto, che non va chiuso */
            act.runOnUiThread(() -> { if (id.equals(recId)) stopRecognizer(); });
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
                case 8: case 10: e = "busy"; break;                                   /* ERROR_RECOGNIZER_BUSY, ERROR_TOO_MANY_REQUESTS: passano da soli */
                case 4: case 11: e = "network"; break;                                /* ERROR_SERVER, ERROR_SERVER_DISCONNECTED */
                case SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED: case SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE: e = "language-not-supported"; break;   /* Android 12+; costanti copiate nel codice, sicure anche prima */
                default: e = "service-not-allowed";
            }
            emit("sr-error", id, e);
            end();
        }
    }

    /** «Stampa» nella scheda Parole: apre il servizio di stampa di Android (anche «Salva come PDF») */
    @JavascriptInterface
    public void print() { act.printPage(); }

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

    /**
     * Apre la scelta dell'app di posta con destinatario, oggetto e testo già compilati e il file ALLEGATO (ACTION_SEND con EXTRA_STREAM).
     * Il «mailto:» non può allegare nulla: per questo lo scambio linguistico passa da qui. Non invia niente: l'invio lo fa la persona.
     */
    @JavascriptInterface
    public boolean sendMail(final String to, final String subject, final String text, String name, String mime, String base64) {
        String safe = name == null ? "mandarino.zip" : name.replaceAll("[^A-Za-z0-9._-]", "_");
        byte[] data;
        try { data = Base64.decode(base64, Base64.DEFAULT); } catch (IllegalArgumentException e) { return false; }
        try {
            File dir = new File(act.getCacheDir(), "share");
            if (!dir.isDirectory() && !dir.mkdirs()) return false;
            File f = new File(dir, safe);
            try (FileOutputStream out = new FileOutputStream(f)) { out.write(data); }
            final Uri uri = ShareProvider.uriFor(f);
            final String type = mime == null || mime.isEmpty() ? "application/zip" : mime;
            act.runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType(type);
                if (to != null && !to.isEmpty()) i.putExtra(Intent.EXTRA_EMAIL, new String[]{to});
                i.putExtra(Intent.EXTRA_SUBJECT, subject == null ? "" : subject);
                i.putExtra(Intent.EXTRA_TEXT, text == null ? "" : text);
                i.putExtra(Intent.EXTRA_STREAM, uri);
                i.setClipData(android.content.ClipData.newRawUri(safe, uri));
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

    private static final String PLECO = "com.pleco.chinesesystem";

    /** apre una parola nel dizionario Pleco: intento plecoapi://x-callback-url/s?q=… diretto al pacchetto di Pleco.
     *  Solo caratteri cinesi, al massimo 16. false se Pleco non è installato (ui/pleco.js mostra allora un messaggio).
     *  La chiama solo un tocco di chi studia, con l'opzione accesa in ⚙️. */
    @JavascriptInterface
    public boolean openPleco(String text) {
        if (text == null) return false;
        final String q = text.trim();
        if (q.isEmpty() || q.length() > 16 || !q.matches("[\\u3400-\\u9fff\\uf900-\\ufaff]+")) return false;
        final Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("plecoapi://x-callback-url/s?q=" + Uri.encode(q)));
        i.setPackage(PLECO);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (i.resolveActivity(act.getPackageManager()) == null) return false;
        try { act.startActivity(i); return true; } catch (ActivityNotFoundException e) { return false; }
    }

    /** la pagina di Pleco nello store (market://), con ripiego sulla pagina web di Google Play */
    @JavascriptInterface
    public void plecoStore() {
        act.runOnUiThread(() -> {
            try {
                act.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + PLECO)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            } catch (ActivityNotFoundException e) {
                act.openExternal(Uri.parse("https://play.google.com/store/apps/details?id=" + PLECO));
            }
        });
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

    /** "direct" (GitHub Releases) o "store" (Google Play, F-Droid): la sceglie la build (productFlavors) */
    @JavascriptInterface
    public String flavor() { return BuildConfig.FLAVOR; }

    void shutdown() {
        try { if (tts != null) { tts.stop(); tts.shutdown(); } } catch (RuntimeException ignored) { }
        stopRecognizer();
    }

    /* ---------------- aggiungere un widget dalla Home (richiesta di sistema) ---------------- */

    /**
     * Contratto con le Impostazioni (JavaScript): il launcher sa mostrare la richiesta «Aggiungi widget» (Android 8+)?
     * Controllare sempre prima con typeof window.MandarinoAndroid.pinWidget === "function".
     */
    @JavascriptInterface
    public boolean widgetPinSupported() {
        try { return WidgetPin.supported(act.getApplicationContext()); } catch (RuntimeException e) { return false; }
    }

    /**
     * Contratto con le Impostazioni: kind = "today_large", "today_small", "pause" o "review". Mostra la richiesta di sistema
     * (la esegue sul thread dell'interfaccia) e ritorna true se è stata mostrata; false se non è supportata o il nome è sconosciuto.
     * Non invia dati e non parte mai da sola: solo da un tocco dell'utente.
     */
    @JavascriptInterface
    public boolean pinWidget(final String kind) {
        final android.content.Context c = act.getApplicationContext();
        final java.util.concurrent.FutureTask<Boolean> job = new java.util.concurrent.FutureTask<>(() -> WidgetPin.request(c, kind));
        act.runOnUiThread(job);
        try {
            return job.get(3, java.util.concurrent.TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        } catch (java.util.concurrent.ExecutionException | java.util.concurrent.TimeoutException | RuntimeException e) {
            return false;
        }
    }
}
