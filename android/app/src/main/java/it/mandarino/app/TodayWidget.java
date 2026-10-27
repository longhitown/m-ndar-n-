package it.mandarino.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.util.ArrayMap;
import android.util.SizeF;
import android.view.View;
import android.widget.RemoteViews;

import java.util.Calendar;
import java.util.Map;

/**
 * Widget «Oggi», 4×2: serie di giorni con un messaggio, ripassi in scadenza, parola del giorno (un tocco mostra il
 * significato), «Studia ora». Da Android 12 ha due disegni (largo e stretto) tra cui sceglie il launcher secondo la
 * misura. La versione 2×1 è TodayWidgetSmall. I dati arrivano dalla pagina (WidgetState), i testi stanno in res/values.
 */
public class TodayWidget extends AppWidgetProvider {
    static final String REVEAL = "it.mandarino.app.WIDGET_REVEAL";

    int layout() { return R.layout.widget_large; }

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) m.updateAppWidget(id, views(c));
    }

    @Override
    public void onReceive(Context c, Intent i) {
        super.onReceive(c, i);
        if (REVEAL.equals(i.getAction())) {
            SharedPreferences p = c.getSharedPreferences(WidgetState.PREFS, Context.MODE_PRIVATE);
            int day = today();
            p.edit().putInt("reveal", p.getInt("reveal", -1) == day ? -1 : day).apply();
            updateAll(c);
        }
    }

    static int today() { Calendar c = Calendar.getInstance(); return c.get(Calendar.YEAR) * 1000 + c.get(Calendar.DAY_OF_YEAR); }

    RemoteViews views(Context c) {
        WidgetState s = WidgetState.load(c);
        if (layout() == R.layout.widget_small) return small(c, s);
        RemoteViews wide = large(c, s, R.layout.widget_large);
        if (Build.VERSION.SDK_INT < 31) return wide;
        /* da Android 12 il launcher sceglie il disegno secondo la misura: stretto sotto ~280 dp, largo oltre */
        Map<SizeF, RemoteViews> sizes = new ArrayMap<>();
        sizes.put(new SizeF(110f, 120f), large(c, s, R.layout.widget_large_narrow));
        sizes.put(new SizeF(280f, 120f), wide);
        return new RemoteViews(sizes);
    }

    RemoteViews small(Context c, WidgetState s) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_small);
        v.setOnClickPendingIntent(R.id.w_root, open(c, "study"));
        v.setTextViewText(R.id.w_due_n, s.dueNumber());
        v.setTextViewText(R.id.w_due_l, s.dueLabel());
        v.setTextViewText(R.id.w_streak, s.streakShort());
        return v;
    }

    RemoteViews large(Context c, WidgetState s, int layout) {
        RemoteViews v = new RemoteViews(c.getPackageName(), layout);
        v.setOnClickPendingIntent(R.id.w_root, open(c, "study"));
        v.setTextViewText(R.id.w_streak, s.streakLine());
        v.setTextViewText(R.id.w_due_n, s.dueNumber());
        v.setTextViewText(R.id.w_due_l, s.dueLabel());
        v.setTextViewText(R.id.w_due_d, s.dueDetail());
        v.setTextViewText(R.id.w_study, s.study());
        v.setOnClickPendingIntent(R.id.w_study, open(c, "study"));
        boolean has = !s.hz.isEmpty();
        v.setViewVisibility(R.id.w_word, has ? View.VISIBLE : View.GONE);
        if (has) {
            boolean shown = c.getSharedPreferences(WidgetState.PREFS, Context.MODE_PRIVATE).getInt("reveal", -1) == today();
            v.setTextViewText(R.id.w_hz, s.hz);
            v.setTextViewText(R.id.w_py, s.py);
            v.setTextViewText(R.id.w_it, shown ? s.it : s.tapMeaning());
            Intent t = new Intent(c, getClass()).setAction(REVEAL);
            v.setOnClickPendingIntent(R.id.w_word, PendingIntent.getBroadcast(c, layout(), t, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }
        return v;
    }

    static PendingIntent open(Context c, String go) {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("mandarino://go/" + go), c, MainActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, go.hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** ridisegna tutti i widget (dopo un nuovo stato dalla pagina o un tocco sulla parola) */
    static void updateAll(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        for (Class<? extends TodayWidget> k : new Class[]{TodayWidget.class, TodayWidgetSmall.class}) {
            int[] ids = m.getAppWidgetIds(new ComponentName(c, k));
            if (ids.length == 0) continue;
            try { TodayWidget w = k.newInstance(); for (int id : ids) m.updateAppWidget(id, w.views(c)); } catch (Exception ignored) { }
        }
    }
}
