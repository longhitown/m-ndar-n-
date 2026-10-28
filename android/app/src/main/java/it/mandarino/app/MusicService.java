package it.mandarino.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;

import java.lang.ref.WeakReference;

/**
 * Musica in secondo piano (solo se scelta nel pannello 🎵): un servizio in primo piano con la notifica del brano
 * (indietro / pausa / avanti) e una MediaSession, così Android non ferma la WebView con lo schermo spento e i comandi
 * arrivano anche dalla schermata di blocco, dalle cuffie e dal Bluetooth. La musica la suona sempre la pagina; ogni
 * comando le arriva come CP.jukebox.remote("prev" | "toggle" | "play" | "pause" | "next"), e la pagina risponde con
 * il titolo e lo stato (musicNotify). La WebView non viene mai messa in pausa (MainActivity non chiama web.onPause()),
 * quindi evaluateJavascript funziona anche con l'activity in secondo piano.
 */
public class MusicService extends Service {
    private static final String CH = "musica";
    static WeakReference<MainActivity> page = new WeakReference<>(null);
    private MediaSession session;

    static void update(Context c, String title, boolean playing) {
        Intent i = new Intent(c, MusicService.class).setAction("state").putExtra("title", title).putExtra("playing", playing);
        try { if (playing) c.startForegroundService(i); else c.startService(i); } catch (RuntimeException ignored) { }
    }

    static void stop(Context c) { c.stopService(new Intent(c, MusicService.class)); }

    private void remote(String cmd) {
        MainActivity m = page.get();
        if (m == null) { stopSelf(); return; }
        m.js("window.CP && CP.jukebox && CP.jukebox.remote(" + org.json.JSONObject.quote(cmd) + ")");
    }

    private MediaSession session() {
        if (session == null) {
            session = new MediaSession(this, "mandarino-musica");
            session.setCallback(new MediaSession.Callback() {
                @Override public void onPlay() { remote("play"); }
                @Override public void onPause() { remote("pause"); }
                @Override public void onSkipToNext() { remote("next"); }
                @Override public void onSkipToPrevious() { remote("prev"); }
                @Override public void onStop() { remote("pause"); }
            });
            session.setActive(true);
        }
        return session;
    }

    @Override
    public int onStartCommand(Intent i, int flags, int id) {
        String a = i == null ? null : i.getAction();
        if ("stop".equals(a)) { stopSelf(); return START_NOT_STICKY; }
        if ("toggle".equals(a) || "next".equals(a) || "prev".equals(a)) { remote(a); return START_NOT_STICKY; }
        String title = i == null ? "" : i.getStringExtra("title");
        boolean playing = i != null && i.getBooleanExtra("playing", false);
        if (title == null || title.isEmpty()) title = "màndarínō";
        MediaSession ms = session();
        ms.setMetadata(new MediaMetadata.Builder().putString(MediaMetadata.METADATA_KEY_TITLE, title).putString(MediaMetadata.METADATA_KEY_ARTIST, "màndarínō")
                /* musica in loop: nessuna durata né posizione, così la scheda di sistema non mostra una barra ferma «00:00 – 00:00» (e non c'è ACTION_SEEK_TO) */
                .putLong(MediaMetadata.METADATA_KEY_DURATION, -1L).build());
        ms.setPlaybackState(new PlaybackState.Builder()
                .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_PLAY_PAUSE | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS | PlaybackState.ACTION_STOP)
                .setState(playing ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED, PlaybackState.PLAYBACK_POSITION_UNKNOWN, playing ? 1f : 0f).build());
        Notification n = build(title, playing);
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
        Notification.Action prev = new Notification.Action.Builder(null, getString(R.string.m_prev), act("prev")).build();
        Notification.Action toggle = new Notification.Action.Builder(null, getString(playing ? R.string.m_pause : R.string.m_play), act("toggle")).build();
        Notification.Action next = new Notification.Action.Builder(null, getString(R.string.m_next), act("next")).build();
        return new Notification.Builder(this, CH)
                .setSmallIcon(R.drawable.notif)
                .setContentTitle(title)
                .setContentText(getString(R.string.sc_music_long))
                .setContentIntent(TodayWidget.open(this, "music"))
                .setDeleteIntent(act("stop"))
                .setVisibility(Notification.VISIBILITY_PUBLIC)   /* i comandi si vedono anche sulla schermata di blocco */
                .setOngoing(playing)
                .addAction(prev).addAction(toggle).addAction(next)
                .setStyle(new Notification.MediaStyle().setMediaSession(session().getSessionToken()).setShowActionsInCompactView(0, 1, 2))
                .build();
    }

    @Override
    public void onDestroy() {
        if (session != null) { session.setActive(false); session.release(); session = null; }
        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent root) { stopSelf(); }

    @Override
    public IBinder onBind(Intent i) { return null; }
}
