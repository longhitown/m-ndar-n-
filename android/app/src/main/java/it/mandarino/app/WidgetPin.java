package it.mandarino.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;

/**
 * Richiesta di aggiunta di un widget alla schermata Home (Android 8+): il sistema mostra la sua finestra «Aggiungi widget» e
 * decide l'utente. Non invia nulla, non si fa mai da sola: parte solo da un tocco dell'utente nelle Impostazioni
 * (Bridge.pinWidget). Se il launcher non lo supporta, ritorna false e l'app spiega come farlo a mano.
 */
final class WidgetPin {
    private WidgetPin() { }

    /** i nomi dei widget: "today_large", "today_small", "pause", "review" (il 4×4), "review_small" (il 2×1); null se il nome non è uno di questi */
    static ComponentName component(Context c, String kind) {
        if (kind == null) return null;
        switch (kind) {
            case "today_large": return new ComponentName(c, TodayWidget.class);
            case "today_small": return new ComponentName(c, TodayWidgetSmall.class);
            case "pause": return new ComponentName(c, PauseWidget.class);
            case "review": return new ComponentName(c, ReviewBigWidget.class);
            case "review_small": return new ComponentName(c, ReviewWidget.class);
            default: return null;
        }
    }

    /** il launcher sa mostrare la richiesta di aggiunta? */
    static boolean supported(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        return m != null && m.isRequestPinAppWidgetSupported();
    }

    /** chiede al sistema di aggiungere il widget; true se la richiesta è stata mostrata (non vuol dire che l'utente abbia confermato) */
    static boolean request(Context c, String kind) {
        ComponentName cn = component(c, kind);
        if (cn == null || !supported(c)) return false;
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        return m.requestPinAppWidget(cn, null, null);
    }
}
