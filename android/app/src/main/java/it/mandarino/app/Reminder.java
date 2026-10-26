package it.mandarino.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import java.util.Calendar;

/**
 * Promemoria giornaliero, spento finché chi studia non lo accende (⚙️ → Promemoria). Un solo avviso al giorno all'ora
 * scelta, calcolato sul telefono dallo stato del widget (WidgetState): nessun server. Non insiste: se oggi hai già
 * studiato, o non c'è niente da fare, non arriva niente. AlarmManager inesatto (nessun permesso speciale), riprogrammato
 * a ogni avviso e dopo il riavvio del telefono.
 */
public class Reminder extends BroadcastReceiver {
    static final String FIRE = "it.mandarino.app.REMINDER";
    private static final String CH = "promemoria";

    @Override
    public void onReceive(Context c, Intent i) {
        String a = i.getAction();
        if (FIRE.equals(a)) notifyNow(c);
        schedule(c);   /* dopo ogni avviso, al riavvio e al cambio d'ora: il prossimo */
    }

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(WidgetState.PREFS, Context.MODE_PRIVATE); }

    static void set(Context c, boolean on, int h, int m) {
        prefs(c).edit().putBoolean("rem_on", on).putInt("rem_h", h).putInt("rem_m", m).apply();
        schedule(c);
    }

    static void schedule(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = PendingIntent.getBroadcast(c, 7, new Intent(c, Reminder.class).setAction(FIRE), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        if (am == null) return;
        am.cancel(pi);
        SharedPreferences p = prefs(c);
        if (!p.getBoolean("rem_on", false)) return;
        Calendar t = Calendar.getInstance();
        t.set(Calendar.HOUR_OF_DAY, p.getInt("rem_h", 20)); t.set(Calendar.MINUTE, p.getInt("rem_m", 0)); t.set(Calendar.SECOND, 0); t.set(Calendar.MILLISECOND, 0);
        if (t.getTimeInMillis() <= System.currentTimeMillis() + 60000) t.add(Calendar.DAY_OF_YEAR, 1);
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t.getTimeInMillis(), pi);
    }

    static void notifyNow(Context c) {
        WidgetState s = WidgetState.load(c);
        if (s.empty || s.activeToday) return;
        String title, text;
        if (s.due > 0) {
            int m = Math.max(1, Math.round(s.due * 20f / 60f));
            title = s.zh() ? "你有 " + s.due + " 个复习 · 约 " + m + " 分钟" : "Hai " + s.due + (s.due == 1 ? " ripasso" : " ripassi") + " · ~" + m + " minuti";
        } else if (s.fresh > 0) {
            title = s.zh() ? "今天的新词在等你" : "Le parole nuove di oggi ti aspettano";
        } else return;
        text = s.streak > 0 ? (s.zh() ? "学一会儿，保持连续 " + s.streak + " 天" : "Un piccolo giro e la serie di " + s.streak + (s.streak == 1 ? " giorno" : " giorni") + " continua")
                            : (s.zh() ? "三分钟就够" : "Bastano tre minuti");
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        nm.createNotificationChannel(new NotificationChannel(CH, s.zh() ? "学习提醒" : "Promemoria di studio", NotificationManager.IMPORTANCE_DEFAULT));
        Notification n = new Notification.Builder(c, CH)
                .setSmallIcon(R.drawable.notif)
                .setContentTitle(title).setContentText(text)
                .setContentIntent(TodayWidget.open(c, "study"))
                .setAutoCancel(true).build();
        try { nm.notify(1, n); } catch (SecurityException ignored) { }
    }
}
