package it.mandarino.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Resources;
import android.os.Build;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;

import java.util.Calendar;

/**
 * Widget «Pausa» (4×1): giri di studio da 25 minuti seguiti da 5 di pausa caffè.
 *
 * Un widget non può animarsi né aggiornarsi ogni secondo, quindi il conto alla rovescia lo fa Android da solo: è un
 * Chronometer in sola discesa (RemoteViews.setChronometer + setChronometerCountDown), che il launcher fa scorrere senza che
 * l'app sia in esecuzione. L'app interviene solo ai cambi di fase (fine giro, fine pausa) con un allarme, e ai tocchi sui tasti.
 * Quando non c'è un giro in corso il widget mostra uno stato fermo scelto dall'ora: «Riposo» di notte, «Pausa caffè a Xi'an»
 * nel primo pomeriggio, altrimenti l'invito a cominciare. Nessuna rete, nessun dato lascia il telefono.
 */
public class PauseWidget extends AppWidgetProvider {
    static final String A_FOCUS = "it.mandarino.app.PAUSE_FOCUS", A_BREAK = "it.mandarino.app.PAUSE_BREAK",
            A_STOP = "it.mandarino.app.PAUSE_STOP", A_TICK = "it.mandarino.app.PAUSE_TICK";
    static final long FOCUS_MS = 25 * 60000L, BREAK_MS = 5 * 60000L;
    private static final String PREFS = "mandarino_pausa", CH = "timer";
    static final String IDLE = "idle", FOCUS = "focus", BREAK = "break";

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        settle(c);
        for (int id : ids) m.updateAppWidget(id, views(c));
    }

    @Override
    public void onReceive(Context c, Intent i) {
        super.onReceive(c, i);
        String a = i.getAction();
        if (A_FOCUS.equals(a)) start(c, FOCUS, FOCUS_MS);
        else if (A_BREAK.equals(a)) start(c, BREAK, BREAK_MS);
        else if (A_STOP.equals(a)) start(c, IDLE, 0);
        else if (A_TICK.equals(a)) {
            String before = prefs(c).getString("phase", IDLE);
            settle(c);
            String after = prefs(c).getString("phase", IDLE);
            if (!before.equals(after)) notifyPhase(c, after);
            updateAll(c);
        }
    }

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static void start(Context c, String phase, long ms) {
        prefs(c).edit().putString("phase", phase).putLong("end", ms > 0 ? System.currentTimeMillis() + ms : 0).apply();
        settle(c);
        updateAll(c);
    }

    /**
     * Porta lo stato a com'è ADESSO: un giro finito passa alla pausa (se anche questa non è già finita), una pausa finita
     * torna a riposo; poi riprogramma l'allarme del prossimo cambio.
     */
    static void settle(Context c) {
        SharedPreferences p = prefs(c);
        String ph = p.getString("phase", IDLE);
        long end = p.getLong("end", 0), now = System.currentTimeMillis();
        if (FOCUS.equals(ph) && now >= end) {
            long be = end + BREAK_MS;
            if (now < be) { ph = BREAK; end = be; } else { ph = IDLE; end = 0; }
        } else if (BREAK.equals(ph) && now >= end) { ph = IDLE; end = 0; }
        else if (IDLE.equals(ph)) end = 0;
        p.edit().putString("phase", ph).putLong("end", end).apply();
        schedule(c, IDLE.equals(ph) ? 0 : end);
    }

    private static PendingIntent tick(Context c) {
        return PendingIntent.getBroadcast(c, 21, new Intent(c, PauseWidget.class).setAction(A_TICK), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void schedule(Context c, long at) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = tick(c);
        am.cancel(pi);
        if (at <= 0) return;
        try {
            /* preciso se il telefono lo permette senza permessi speciali; altrimenti inesatto (può slittare di qualche minuto in Doze) */
            if (Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms()) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        } catch (SecurityException e) { am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi); }
    }

    static PendingIntent action(Context c, String a, int code) {
        return PendingIntent.getBroadcast(c, code, new Intent(c, PauseWidget.class).setAction(a), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    RemoteViews views(Context c) {
        WidgetState s = WidgetState.load(c);
        Resources r = s.r;
        SharedPreferences p = prefs(c);
        String ph = p.getString("phase", IDLE);
        long end = p.getLong("end", 0);
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_pause);
        v.setOnClickPendingIntent(R.id.w_root, TodayWidget.open(c, "study"));
        boolean running = !IDLE.equals(ph) && end > System.currentTimeMillis();
        if (running) {
            boolean focus = FOCUS.equals(ph);
            v.setImageViewResource(R.id.t_icon, focus ? R.drawable.ic_w_flame : R.drawable.ic_w_cup);
            v.setTextViewText(R.id.t_title, r.getString(focus ? R.string.p_title_focus : R.string.p_title_break));
            v.setTextViewText(R.id.t_sub, r.getString(focus ? R.string.p_sub_focus : R.string.p_sub_break));
            v.setViewVisibility(R.id.t_chrono, View.VISIBLE);
            v.setChronometerCountDown(R.id.t_chrono, true);
            v.setChronometer(R.id.t_chrono, SystemClock.elapsedRealtime() + (end - System.currentTimeMillis()), null, true);
            v.setTextViewText(R.id.t_b1, r.getString(focus ? R.string.p_b_stop : R.string.p_b_skip));
            v.setOnClickPendingIntent(R.id.t_b1, action(c, A_STOP, 24));
            v.setViewVisibility(R.id.t_b2, View.GONE);
            return v;
        }
        v.setViewVisibility(R.id.t_chrono, View.GONE);
        int h = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        if (h >= 22 || h < 6) {   /* riposo: niente da avviare */
            v.setImageViewResource(R.id.t_icon, R.drawable.ic_w_moon);
            v.setTextViewText(R.id.t_title, r.getString(R.string.p_title_rest));
            v.setTextViewText(R.id.t_sub, r.getString(R.string.p_sub_rest));
            v.setViewVisibility(R.id.t_b1, View.GONE);
            v.setViewVisibility(R.id.t_b2, View.GONE);
            return v;
        }
        boolean coffee = h >= 14 && h < 18;   /* il primo pomeriggio: la pausa caffè */
        v.setImageViewResource(R.id.t_icon, coffee ? R.drawable.ic_w_cup : R.drawable.ic_w_flame);
        v.setTextViewText(R.id.t_title, r.getString(coffee ? R.string.p_title_coffee : R.string.p_title_idle));
        v.setTextViewText(R.id.t_sub, r.getString(coffee ? R.string.p_sub_coffee : R.string.p_sub_idle));
        v.setViewVisibility(R.id.t_b1, View.VISIBLE);
        v.setViewVisibility(R.id.t_b2, View.VISIBLE);
        v.setTextViewText(R.id.t_b1, r.getString(R.string.p_b_focus));
        v.setTextViewText(R.id.t_b2, r.getString(R.string.p_b_break));
        v.setOnClickPendingIntent(R.id.t_b1, action(c, A_FOCUS, 22));
        v.setOnClickPendingIntent(R.id.t_b2, action(c, A_BREAK, 23));
        return v;
    }

    /** un avviso, solo ai cambi di fase di un giro che hai avviato tu (se l'app ha il permesso delle notifiche) */
    static void notifyPhase(Context c, String phase) {
        WidgetState s = WidgetState.load(c);
        Resources r = s.r;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        boolean toBreak = BREAK.equals(phase);
        nm.createNotificationChannel(new NotificationChannel(CH, r.getString(R.string.p_n_channel), NotificationManager.IMPORTANCE_DEFAULT));
        Notification n = new Notification.Builder(c, CH)
                .setSmallIcon(R.drawable.notif)
                .setContentTitle(r.getString(toBreak ? R.string.p_n_break_title : R.string.p_n_end_title))
                .setContentText(r.getString(toBreak ? R.string.p_n_break_text : R.string.p_n_end_text))
                .setContentIntent(TodayWidget.open(c, "study"))
                .setAutoCancel(true).build();
        try { nm.notify(2, n); } catch (SecurityException ignored) { }
    }

    static void updateAll(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = m.getAppWidgetIds(new ComponentName(c, PauseWidget.class));
        if (ids.length == 0) return;
        RemoteViews v = new PauseWidget().views(c);
        for (int id : ids) m.updateAppWidget(id, v);
    }
}
