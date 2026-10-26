package it.mandarino.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;

import java.lang.ref.WeakReference;

/**
 * Musica in secondo piano (solo se scelta nel pannello 🎵): un servizio in primo piano con la notifica del brano
 * (pausa / riprendi / successivo), così Android non ferma la WebView con lo schermo spento. La musica la suona sempre la
 * pagina; i tasti della notifica le arrivano come CP.jukebox.remote("toggle" | "next").
 */
public class MusicService extends Service {
    private static final String CH = "musica";
    static WeakReference<MainActivity> page = new WeakReference<>(null);

    static void update(Context c, String title, boolean playing) {
        Intent i = new Intent(c, MusicService.class).setAction("state").putExtra("title", title).putExtra("playing", playing);
        try { if (playing) c.startForegroundService(i); else c.startService(i); } catch (RuntimeException ignored) { }
    }

    static void stop(Context c) { c.stopService(new Intent(c, MusicService.class)); }

    @Override
    public int onStartCommand(Intent i, int flags, int id) {
        String a = i == null ? null : i.getAction();
        if ("stop".equals(a)) { stopSelf(); return START_NOT_STICKY; }
        if ("toggle".equals(a) || "next".equals(a)) {
            MainActivity m = page.get();
            if (m == null) { stopSelf(); return START_NOT_STICKY; }
            m.js("window.CP && CP.jukebox && CP.jukebox.remote(" + org.json.JSONObject.quote(a) + ")");
            return START_NOT_STICKY;
        }
        String title = i == null ? "" : i.getStringExtra("title");
        boolean playing = i != null && i.getBooleanExtra("playing", false);
        Notification n = build(title == null || title.isEmpty() ? "màndarínō" : title, playing);
        if (playing) {
            if (Build.VERSION.SDK_INT >= 29) startForeground(2, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            else startForeground(2, n);
        } else {
            stopForeground(STOP_FOREGROUND_DETACH);
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) try { nm.notify(2, n); } catch (SecurityException ignored) { }
        }
        return START_NOT_STICKY;
    }

    private PendingIntent act(String a) {
        return PendingIntent.getService(this, a.hashCode(), new Intent(this, MusicService.class).setAction(a), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private Notification build(String title, boolean playing) {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm != null) nm.createNotificationChannel(new NotificationChannel(CH, getString(R.string.sc_music), NotificationManager.IMPORTANCE_LOW));
        Notification.Action toggle = new Notification.Action.Builder(null, getString(playing ? R.string.m_pause : R.string.m_play), act("toggle")).build();
        Notification.Action next = new Notification.Action.Builder(null, getString(R.string.m_next), act("next")).build();
        return new Notification.Builder(this, CH)
                .setSmallIcon(R.drawable.notif)
                .setContentTitle(title)
                .setContentText(getString(R.string.sc_music_long))
                .setContentIntent(TodayWidget.open(this, "music"))
                .setDeleteIntent(act("stop"))
                .setOngoing(playing)
                .addAction(toggle).addAction(next)
                .setStyle(new Notification.MediaStyle().setShowActionsInCompactView(0, 1))
                .build();
    }

    @Override
    public void onTaskRemoved(Intent root) { stopSelf(); }

    @Override
    public IBinder onBind(Intent i) { return null; }
}
