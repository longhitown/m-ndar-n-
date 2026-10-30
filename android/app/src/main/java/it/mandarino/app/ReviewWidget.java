package it.mandarino.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.res.Resources;
import android.widget.RemoteViews;

/**
 * Widget «Ripasso rapido» (2×1, ridimensionabile): il numero di carte da ripassare ADESSO, grande, e sotto «carta/carte da
 * ripassare»; a zero un «✓» e «Tutto ripassato». Un tocco apre l'app direttamente al ripasso (mandarino://go/study, come gli altri
 * widget). Il numero lo calcola WidgetState dallo stato che la pagina manda con setWidgetState (scadute + istogramma delle prossime
 * 168 ore): nessuna rete, nessun dato lascia il telefono. Si ridisegna a ogni nuovo stato (TodayWidget.updateAll) e, per le carte
 * che scadono col passare delle ore, con l'aggiornamento periodico di Android.
 */
public class ReviewWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        TodayWidget.scheduleBand(c);
        RemoteViews v = views(c);
        for (int id : ids) m.updateAppWidget(id, v);
    }

    @Override
    public void onEnabled(Context c) { TodayWidget.scheduleBand(c); }

    static RemoteViews views(Context c) {
        WidgetState s = WidgetState.load(c);
        Resources r = s.r;
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_review);
        v.setInt(R.id.w_root, "setBackgroundResource", WidgetState.background(WidgetState.band()));
        v.setOnClickPendingIntent(R.id.w_root, TodayWidget.open(c, "study"));
        String number, label, spoken;
        if (s.empty) {
            number = "—";
            label = r.getString(R.string.r_empty);
            spoken = r.getString(R.string.r_cd_empty);
        } else if (s.due > 0) {
            number = s.due > 999 ? "999+" : String.valueOf(s.due);
            label = r.getQuantityString(R.plurals.r_cards, s.due);
            spoken = r.getQuantityString(R.plurals.r_cd_cards, s.due, s.due);
        } else {
            number = "✓";
            label = r.getString(R.string.r_done);
            spoken = r.getString(R.string.r_cd_done);
        }
        v.setTextViewText(R.id.r_n, number);
        v.setTextViewText(R.id.r_l, label);
        v.setContentDescription(R.id.w_root, spoken);
        return v;
    }

    /** ridisegna tutti i widget «Ripasso rapido» (dopo un nuovo stato dalla pagina o a un cambio di fascia) */
    static void updateAll(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = m.getAppWidgetIds(new ComponentName(c, ReviewWidget.class));
        if (ids.length == 0) return;
        RemoteViews v = views(c);
        for (int id : ids) m.updateAppWidget(id, v);
    }
}
