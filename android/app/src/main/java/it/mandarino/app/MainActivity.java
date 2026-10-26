package it.mandarino.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;
import android.webkit.PermissionRequest;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * L'app è la stessa pagina di dist/index.html, servita dal pacchetto all'indirizzo https://appassets.androidplatform.net/
 * (un'origine https vera: microfono e salvataggi funzionano come sul web, e non cambia mai, così i progressi restano
 * da una versione all'altra). Nessuna richiesta di rete per aprirla: tutto è dentro l'APK.
 */
public class MainActivity extends Activity {
    static final String HOST = "appassets.androidplatform.net";
    static final String START = "https://" + HOST + "/index.html";
    private static final int REQ_FILE = 1, REQ_MIC = 2;
    static final int REQ_SYNC = 3;
    private static final int REQ_CAM = 4;
    private PermissionRequest pendingCamera;

    WebView web;
    private Bridge bridge;
    private ValueCallback<Uri[]> fileCallback;
    private PermissionRequest pendingWebPermission;
    private final List<Runnable> afterMic = new ArrayList<>();

    @Override
    @SuppressLint("SetJavaScriptEnabled")   /* la pagina è solo quella del pacchetto: ogni altro indirizzo va al browser */
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        if (BuildConfig.DEBUG) WebView.setWebContentsDebuggingEnabled(true);   /* solo le build di prova: chrome://inspect */
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportMultipleWindows(false);
        s.setUserAgentString(s.getUserAgentString() + " MandarinoApk/" + BuildConfig.VERSION_NAME);

        bridge = new Bridge(this);
        web.addJavascriptInterface(bridge, "MandarinoAndroid");
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());

        if (state != null) web.restoreState(state);
        if (web.getUrl() == null) web.loadUrl(START);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    /** I file dell'app (assets/www) e nient'altro dall'origine dell'app; tutto il resto va al browser del telefono. */
    private class Client extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
            Uri u = req.getUrl();
            if (!HOST.equals(u.getHost())) return null;
            String path = u.getPath();
            if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
            if (path.contains("..")) return notFound();
            try {
                InputStream in = getAssets().open("www" + path);
                String mime = mime(path);
                return new WebResourceResponse(mime, mime.startsWith("text/") || mime.endsWith("json") || mime.endsWith("javascript") ? "utf-8" : null, in);
            } catch (IOException e) {
                return notFound();
            }
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
            Uri u = req.getUrl();
            if (HOST.equals(u.getHost()) && "https".equals(u.getScheme())) return false;
            openExternal(u);
            return true;
        }

        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            /* il motore della pagina si è chiuso (memoria): si riparte da capo, i progressi sono già salvati */
            recreate();
            return true;
        }
    }

    private static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, new ByteArrayInputStream(new byte[0]));
    }

    static String mime(String path) {
        String p = path.toLowerCase(Locale.ROOT);
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "text/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".txt")) return "text/plain";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".mp3")) return "audio/mpeg";
        if (p.endsWith(".ogg")) return "audio/ogg";
        return "application/octet-stream";
    }

    void openExternal(Uri u) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, u);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, R.string.no_app, Toast.LENGTH_SHORT).show();
        }
    }

    private class Chrome extends WebChromeClient {
        /* il microfono della pagina (getUserMedia): si chiede il permesso di Android, poi si concede alla pagina */
        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            /* microfono (pronuncia) e fotocamera (passaggio dei progressi con i QR): solo per la pagina dell'app */
            boolean audio = false, video = false;
            for (String r : request.getResources()) {
                if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) audio = true;
                if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) video = true;
            }
            if ((!audio && !video) || !HOST.equals(request.getOrigin().getHost())) { request.deny(); return; }
            if (video) {
                if (hasCamera()) { request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE}); return; }
                if (pendingCamera != null) pendingCamera.deny();
                pendingCamera = request;
                requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_CAM);
                return;
            }
            if (hasMic()) { request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE}); return; }
            if (pendingWebPermission != null) pendingWebPermission.deny();
            pendingWebPermission = request;
            requestMic(null);
        }

        @Override
        public void onPermissionRequestCanceled(PermissionRequest request) {
            if (pendingWebPermission == request) pendingWebPermission = null;
            if (pendingCamera == request) pendingCamera = null;
        }

        /* <input type="file">: ripristino di un backup */
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = cb;
            try {
                Intent i = params.createIntent();
                i.setType("*/*");
                startActivityForResult(i, REQ_FILE);
            } catch (ActivityNotFoundException e) {
                fileCallback = null;
                cb.onReceiveValue(null);
                return false;
            }
            return true;
        }
    }

    boolean hasCamera() {
        return checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
    }

    boolean hasMic() {
        return checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    /** chiede il microfono; «then» parte solo se il permesso viene concesso */
    void requestMic(Runnable then) {
        if (hasMic()) { if (then != null) then.run(); return; }
        if (then != null) afterMic.add(then);
        requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        super.onRequestPermissionsResult(code, perms, results);
        if (code == REQ_CAM) {
            boolean cam = results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
            if (pendingCamera != null) { if (cam) pendingCamera.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE}); else pendingCamera.deny(); pendingCamera = null; }
            return;
        }
        if (code != REQ_MIC) return;
        boolean ok = results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
        if (pendingWebPermission != null) {
            if (ok) pendingWebPermission.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
            else pendingWebPermission.deny();
            pendingWebPermission = null;
        }
        List<Runnable> todo = new ArrayList<>(afterMic);
        afterMic.clear();
        if (ok) for (Runnable r : todo) r.run();
        else { bridge.micDenied(); Toast.makeText(this, R.string.mic_denied, Toast.LENGTH_LONG).show(); }
    }

    @Override
    protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code == REQ_SYNC) { bridge.syncPicked(result == RESULT_OK && data != null ? data.getData() : null); return; }
        if (code == REQ_FILE && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            fileCallback = null;
        }
    }

    /* Indietro: chiude prima il foglio aperto, poi la sessione, poi torna al Percorso; solo alla fine esce */
    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        web.evaluateJavascript("(window.__mdBack && window.__mdBack()) ? 1 : 0", value -> {
            if (!"1".equals(value)) MainActivity.super.onBackPressed();
        });
    }

    /** colore delle barre di sistema, scelto dalla pagina (tema chiaro, scuro, carta di riso) */
    void setBars(int color) {
        Window w = getWindow();
        w.setStatusBarColor(color);
        w.setNavigationBarColor(color);
        double lum = (0.299 * Color.red(color) + 0.587 * Color.green(color) + 0.114 * Color.blue(color)) / 255.0;
        boolean light = lum > 0.6;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                int m = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                c.setSystemBarsAppearance(light ? m : 0, m);
            }
        } else legacyBars(w.getDecorView(), light);
    }

    @SuppressWarnings("deprecation")
    private static void legacyBars(View d, boolean light) {
        int f = d.getSystemUiVisibility();
        if (light) f |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        else f &= ~(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        d.setSystemUiVisibility(f);
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.evaluateJavascript("window.Store && Store.flush && Store.flush()", null);
    }

    @Override
    protected void onDestroy() {
        bridge.shutdown();
        if (web != null) { web.removeJavascriptInterface("MandarinoAndroid"); web.destroy(); }
        super.onDestroy();
    }

    /** esegue JavaScript nella pagina dal thread dell'interfaccia */
    void js(final String code) {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript(code, null); });
    }
}
