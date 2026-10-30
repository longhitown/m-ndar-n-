package it.mandarino.app;

import android.app.AlarmManager;
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
 * Widget «Oggi», 4×2, stile «Giada»: grado, un messaggio breve che cambia con l'ora, striscia a dieci segmenti dell'obiettivo,
 * ripassi in scadenza, parola del giorno in un riquadro di vetro (un tocco mostra il significato; la sera al suo posto un
 * proverbio), «Studia ora». Quattro atmosfere (mattina, pomeriggio, sera, notte) cambiano sfondo, accenti e testi;
 * un allarme inesatto ridisegna i widget ai confini di fascia. Android non permette sfocature né animazioni nei widget. Da Android 12 ha due disegni (largo e stretto) tra cui sceglie il launcher secondo la
 * misura. La versione 2×1 è TodayWidgetSmall. I dati arrivano dalla pagina (WidgetState), i testi stanno in res/values.
 */
public class TodayWidget extends AppWidgetProvider {
    static final String REVEAL = "it.mandarino.app.WIDGET_REVEAL", BAND = "it.mandarino.app.WIDGET_BAND";
    static final int[] SEG = {R.id.w_s0, R.id.w_s1, R.id.w_s2, R.id.w_s3, R.id.w_s4, R.id.w_s5, R.id.w_s6, R.id.w_s7, R.id.w_s8, R.id.w_s9};

    int layout() { return R.layout.widget_large; }

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        scheduleBand(c);
        for (int id : ids) m.updateAppWidget(id, views(c));
    }

    @Override
    public void onEnabled(Context c) { scheduleBand(c); }

    /** un allarme inesatto al prossimo cambio di fascia: basta che il widget cambi faccia entro qualche minuto */
    static void scheduleBand(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = PendingIntent.getBroadcast(c, 31, new Intent(c, TodayWidget.class).setAction(BAND), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        am.cancel(pi);
        am.setAndAllowWhileIdle(AlarmManager.RTC, WidgetState.nextBandChange(), pi);
    }

    @Override
    public void onReceive(Context c, Intent i) {
        super.onReceive(c, i);
        if (BAND.equals(i.getAction())) { scheduleBand(c); updateAll(c); return; }
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
        int band = WidgetState.band();
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_small);
        v.setInt(R.id.w_root, "setBackgroundResource", WidgetState.background(band));
        v.setOnClickPendingIntent(R.id.w_root, open(c, "study"));
        boolean night = band == WidgetState.NIGHT;
        v.setTextViewText(R.id.w_due_n, night ? "☾" : s.dueNumber());
        v.setTextViewText(R.id.w_due_l, night ? s.r.getString(R.string.p_title_rest) : s.dueLabel());
        v.setTextViewText(R.id.w_streak, s.streakShort());
        flame(v, s, band);
        return v;
    }

    /** la fiamma della serie: arancione, più scura la sera; di notte sparisce */
    static void flame(RemoteViews v, WidgetState s, int band) {
        v.setViewVisibility(R.id.w_flame, band == WidgetState.NIGHT ? View.GONE : View.VISIBLE);
        v.setImageViewResource(R.id.w_flame, band == WidgetState.EVENING && s.streak > 0 ? R.drawable.ic_g_flame_deep : R.drawable.ic_g_flame);
    }

    RemoteViews large(Context c, WidgetState s, int layout) {
        int band = WidgetState.band();
        boolean night = band == WidgetState.NIGHT, evening = band == WidgetState.EVENING, morning = band == WidgetState.MORNING;
        RemoteViews v = new RemoteViews(c.getPackageName(), layout);
        v.setInt(R.id.w_root, "setBackgroundResource", WidgetState.background(band));
        v.setOnClickPendingIntent(R.id.w_root, open(c, "study"));
        /* in alto: il sigillo del grado (sole al mattino, luna di notte) e il messaggio dell'ora */
        v.setViewVisibility(R.id.w_seal, morning || night ? View.GONE : View.VISIBLE);
        v.setViewVisibility(R.id.w_icon, morning || night ? View.VISIBLE : View.GONE);
        v.setImageViewResource(R.id.w_icon, night ? R.drawable.ic_g_moon : R.drawable.ic_g_sun);
        if (!s.rank.isEmpty()) v.setTextViewText(R.id.w_seal, s.rank);
        v.setTextViewText(R.id.w_title, night ? s.r.getString(R.string.p_title_rest) : s.microCopy(band));
        v.setTextViewText(R.id.w_streak, night ? s.microCopy(band) : s.streakLine());
        v.setTextColor(R.id.w_streak, c.getColor(evening && s.streak > 0 ? R.color.w_g_orange : R.color.w_g_mute));
        flame(v, s, band);
        /* la striscia dell'obiettivo del giorno: dieci segmenti, di notte nascosta */
        v.setViewVisibility(R.id.w_segs, night ? View.GONE : View.VISIBLE);
        int on = s.segments();
        for (int i = 0; i < SEG.length; i++) v.setImageViewResource(SEG[i], i < on ? R.drawable.w_seg_on : R.drawable.w_seg_off);
        /* a destra: i ripassi e il pulsante; di notte niente numeri né pulsanti */
        v.setViewVisibility(R.id.w_right, night ? View.GONE : View.VISIBLE);
        v.setTextViewText(R.id.w_due_n, s.dueNumber());
        v.setTextViewText(R.id.w_due_l, s.dueLabel());
        v.setTextViewText(R.id.w_due_d, s.dueDetail());
        v.setTextViewText(R.id.w_study, s.startLabel(band));
        v.setInt(R.id.w_study, "setBackgroundResource", evening ? R.drawable.w_btn_giada_deep : R.drawable.w_btn_giada);
        v.setOnClickPendingIntent(R.id.w_study, open(c, "study"));
        /* il riquadro di vetro: la parola del giorno (un tocco = significato); la sera un proverbio; di notte nulla */
        boolean has = !s.hz.isEmpty() && !night && !evening;
        v.setViewVisibility(R.id.w_word, has || evening ? View.VISIBLE : View.GONE);
        if (evening) {
            String[] pv = s.proverb();
            v.setViewVisibility(R.id.w_hz, View.GONE);
            v.setTextViewText(R.id.w_py, pv[0]);
            v.setTextViewText(R.id.w_it, pv[1]);
            v.setOnClickPendingIntent(R.id.w_word, open(c, "study"));
        } else if (has) {
            boolean shown = c.getSharedPreferences(WidgetState.PREFS, Context.MODE_PRIVATE).getInt("reveal", -1) == today();
            v.setViewVisibility(R.id.w_hz, View.VISIBLE);
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
        PauseWidget.updateAll(c);
        ReviewWidget.updateAll(c);
    }
}
