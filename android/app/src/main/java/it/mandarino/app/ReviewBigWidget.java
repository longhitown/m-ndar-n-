package it.mandarino.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Resources;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Widget «Ripasso rapido» 4×4 (ridimensionabile da 3×3): le carte da ripassare, una alla volta, senza aprire l'app.
 *
 * Il mazzo (fino a 20 carte scadute, le più dimenticate prima) lo manda la pagina dentro lo stato (pwa/widget.js, campo "deck"):
 * si legge con WidgetState. Una sessione è di 10 carte: fronte («Tocca per vedere la risposta»), retro con i quattro voti
 * dell'app («Non la so», «Quasi», «La so», «Facile»), poi «Ripasso finito» con «Ancora un po'» e «Apri màndarínō».
 * Tutto in RemoteViews: ogni tocco è un broadcast esplicito verso questo widget (PendingIntent immutabile, requestCode unico per
 * azione e per widget), gestito in onReceive; lo stato della sessione (quante carte fatte, retro mostrato, ora dell'ultimo voto)
 * sta in ReviewQueue.prefs, privato.
 *
 * I voti non si applicano qui (niente motore FSRS): vanno in coda (ReviewQueue) e li applica l'app alla prossima apertura con
 * l'ora originale. Nel frattempo una carta votata non si ripropone: si nasconde finché l'app non manda uno stato più recente
 * dell'ultimo voto (a quel punto il mazzo è già rigenerato dall'app, dopo aver applicato la coda). Nessuna rete.
 * Il receiver non è esportato: i tocchi arrivano con i PendingIntent del widget, nessun'altra app può inviare voti.
 */
public class ReviewBigWidget extends AppWidgetProvider {
    static final String A_REVEAL = "it.mandarino.app.RIPASSO_REVEAL", A_GRADE = "it.mandarino.app.RIPASSO_GRADE", A_MORE = "it.mandarino.app.RIPASSO_MORE";
    private static final String X_GRADE = "grade", X_KEY = "key";
    private static final String K_SN = "sn", K_SD = "sd", K_REV = "rev", K_LS = "ls";
    /** carte di una sessione */
    static final int SESSION = 10;
    private static final int[] GRADE_IDS = {R.id.rb_g0, R.id.rb_g1, R.id.rb_g2, R.id.rb_g3};
    private static final int[] GRADE_TEXT = {R.string.rb_grade_0, R.string.rb_grade_1, R.string.rb_grade_2, R.string.rb_grade_3};

    /** una carta del mazzo: chiave, carattere (hz), pinyin, e it = significato in italiano (corso di cinese) o parola italiana (corso di italiano) */
    private static final class Card {
        final String k, hz, py, it;
        Card(String k, String hz, String py, String it) { this.k = k; this.hz = hz; this.py = py; this.it = it; }
    }

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        TodayWidget.scheduleBand(c);
        for (int id : ids) m.updateAppWidget(id, views(c, id, compact(m.getAppWidgetOptions(id))));
    }

    @Override
    public void onEnabled(Context c) { TodayWidget.scheduleBand(c); }

    @Override
    public void onAppWidgetOptionsChanged(Context c, AppWidgetManager m, int id, Bundle options) {
        super.onAppWidgetOptionsChanged(c, m, id, options);
        m.updateAppWidget(id, views(c, id, compact(options)));
    }

    @Override
    public void onReceive(Context c, Intent i) {
        super.onReceive(c, i);
        String a = i.getAction();
        if (!A_REVEAL.equals(a) && !A_GRADE.equals(a) && !A_MORE.equals(a)) return;
        synchronized (ReviewQueue.LOCK) {
            WidgetState s = WidgetState.load(c);
            SharedPreferences p = ReviewQueue.prefs(c);
            List<Card> left = remaining(c, s);
            settle(p, s, left.size());
            int sn = p.getInt(K_SN, 0), sd = p.getInt(K_SD, 0);
            boolean has = sn > 0 && sd < sn && !left.isEmpty();
            String key = i.getStringExtra(X_KEY);
            if (A_MORE.equals(a)) {
                /* un'altra sessione, se restano carte e non ce n'è una in corso */
                if (!has && !left.isEmpty()) p.edit().putInt(K_SN, Math.min(SESSION, left.size())).putInt(K_SD, 0).putBoolean(K_REV, false).apply();
            } else if (has && key != null && key.equals(left.get(0).k)) {
                /* il tocco vale solo per la carta che si vedeva quando è stato fatto */
                if (A_REVEAL.equals(a)) {
                    p.edit().putBoolean(K_REV, true).apply();
                } else if (p.getBoolean(K_REV, false)) {
                    int g = i.getIntExtra(X_GRADE, -1);
                    if (g >= 0 && g <= 3) {
                        long now = System.currentTimeMillis();
                        ReviewQueue.addVote(c, key, g, s.dc, now);
                        p.edit().putInt(K_SD, sd + 1).putBoolean(K_REV, false).putLong(K_LS, now).apply();
                    }
                }
            }
        }
        updateAll(c);
    }

    /** ridisegna tutti i widget «Ripasso rapido» 4×4 (dopo un nuovo stato dalla pagina, un tocco o un cambio di fascia) */
    static void updateAll(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = m.getAppWidgetIds(new ComponentName(c, ReviewBigWidget.class));
        for (int id : ids) m.updateAppWidget(id, views(c, id, compact(m.getAppWidgetOptions(id))));
    }

    /** sotto i ~230 dp di altezza i caratteri si rimpiccioliscono, perché stiano carta e voti */
    private static boolean compact(Bundle options) {
        return options != null && options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 250) < 230;
    }

    /** le carte del mazzo ancora da fare: via quelle già votate nel widget dopo che l'app ha mandato lo stato */
    private static List<Card> remaining(Context c, WidgetState s) {
        List<Card> out = new ArrayList<>();
        if (s.deck == null) return out;
        Map<String, Long> voted = ReviewQueue.recent(c);
        for (int n = 0; n < s.deck.length(); n++) {
            JSONObject o = s.deck.optJSONObject(n);
            if (o == null) continue;
            String k = o.optString("k");
            Long vt = voted.get(k);
            if (k.isEmpty() || (vt != null && vt > s.stateT)) continue;
            out.add(new Card(k, o.optString("hz"), o.optString("py"), o.optString("it")));
        }
        return out;
    }

    /**
     * Se non c'è una sessione in corso e ci sono carte: ne comincia una, a meno che l'ultima sia appena finita e l'app non abbia
     * ancora mandato uno stato più recente (allora resta «Ripasso finito», con «Ancora un po'»).
     */
    private static void settle(SharedPreferences p, WidgetState s, int left) {
        int sn = p.getInt(K_SN, 0), sd = p.getInt(K_SD, 0);
        boolean running = sn > 0 && sd < sn && left > 0;
        if (running || left == 0) return;
        if (sd == 0 || s.stateT > p.getLong(K_LS, 0)) p.edit().putInt(K_SN, Math.min(SESSION, left)).putInt(K_SD, 0).putBoolean(K_REV, false).apply();
    }

    private static void show(RemoteViews v, int id, boolean on) { v.setViewVisibility(id, on ? View.VISIBLE : View.GONE); }

    private static PendingIntent act(Context c, int id, String action, int code, int grade, String key) {
        Intent i = new Intent(c, ReviewBigWidget.class).setAction(action)
                .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id).putExtra(X_GRADE, grade).putExtra(X_KEY, key);
        return PendingIntent.getBroadcast(c, id * 16 + code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** grandezza (sp) del testo davanti: corto = grande; sul retro più piccolo; in poco spazio ancora meno */
    private static float frontSize(String t, boolean zh, boolean back, boolean compact) {
        int n = t.codePointCount(0, t.length());
        float size;
        if (zh) size = n <= 2 ? 56f : n <= 4 ? 42f : 28f;
        else size = n <= 8 ? 34f : n <= 16 ? 26f : 20f;
        if (back) size *= 0.75f;
        if (compact) size *= 0.8f;
        return size;
    }

    static RemoteViews views(Context c, int id, boolean compact) {
        synchronized (ReviewQueue.LOCK) {
            WidgetState s = WidgetState.load(c);
            Resources r = s.r;
            SharedPreferences p = ReviewQueue.prefs(c);
            List<Card> left = remaining(c, s);
            settle(p, s, left.size());
            int sn = p.getInt(K_SN, 0), sd = p.getInt(K_SD, 0);
            long ls = p.getLong(K_LS, 0);
            boolean rev = p.getBoolean(K_REV, false), has = sn > 0 && sd < sn && !left.isEmpty(), zh = !"it".equals(s.dc);
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_review_big);
            v.setInt(R.id.w_root, "setBackgroundResource", WidgetState.background(WidgetState.band()));
            v.setOnClickPendingIntent(R.id.w_root, TodayWidget.open(c, "study"));
            v.setTextViewText(R.id.rb_title, r.getString(R.string.rb_name));
            if (has) {
                Card k = left.get(0);
                int total = Math.min(sn, sd + left.size());
                String first = zh ? k.hz : k.it;
                /* corso di cinese: davanti il carattere, dietro pinyin e significato; corso di italiano: davanti la parola italiana, dietro cinese e pinyin */
                String line1 = zh ? k.py : k.hz, line2 = zh ? k.it : k.py;
                float scale = compact ? 0.85f : 1f;
                show(v, R.id.rb_count, true);
                v.setTextViewText(R.id.rb_count, r.getString(R.string.rb_count, sd + 1, total));
                show(v, R.id.rb_msg, false);
                show(v, R.id.rb_actions, false);
                show(v, R.id.rb_front, true);
                v.setTextViewText(R.id.rb_front, first);
                v.setTextViewTextSize(R.id.rb_front, TypedValue.COMPLEX_UNIT_SP, frontSize(first, zh, rev, compact));
                v.setOnClickPendingIntent(R.id.rb_body, act(c, id, A_REVEAL, 1, -1, k.k));
                show(v, R.id.rb_hint, !rev);
                v.setTextViewText(R.id.rb_hint, r.getString(R.string.rb_hint));
                show(v, R.id.rb_a, rev);
                show(v, R.id.rb_b, rev);
                show(v, R.id.rb_grades, rev);
                if (rev) {
                    v.setTextViewText(R.id.rb_a, line1);
                    v.setTextViewText(R.id.rb_b, line2);
                    v.setTextColor(R.id.rb_a, c.getColor(zh ? R.color.w_g_mint : R.color.w_g_text));
                    v.setTextColor(R.id.rb_b, c.getColor(zh ? R.color.w_g_text : R.color.w_g_mint));
                    v.setTextViewTextSize(R.id.rb_a, TypedValue.COMPLEX_UNIT_SP, (zh ? 20f : 30f) * scale);
                    v.setTextViewTextSize(R.id.rb_b, TypedValue.COMPLEX_UNIT_SP, 16f * scale);
                    for (int g = 0; g < GRADE_IDS.length; g++) {
                        v.setTextViewText(GRADE_IDS[g], r.getString(GRADE_TEXT[g]));
                        v.setOnClickPendingIntent(GRADE_IDS[g], act(c, id, A_GRADE, 2 + g, g, k.k));
                    }
                    v.setContentDescription(R.id.rb_body, r.getString(R.string.rb_cd_back, sd + 1, total, first, line1 + ", " + line2));
                } else {
                    v.setContentDescription(R.id.rb_body, r.getString(R.string.rb_cd_front, sd + 1, total, first));
                }
            } else {
                /* niente carta da mostrare: l'invito ad aprire l'app, «Tutto ripassato», o «Ripasso finito» */
                boolean finished = sd > 0 && s.stateT <= ls, more = !s.empty && !left.isEmpty();
                String msg;
                if (s.empty) msg = r.getString(R.string.rb_start);
                else if (finished) msg = r.getQuantityString(R.plurals.rb_done, sd, sd);
                else if (s.due > 0) msg = r.getQuantityString(R.plurals.rb_due, s.due, s.due);
                else msg = r.getString(R.string.rb_nothing);
                show(v, R.id.rb_count, false);
                show(v, R.id.rb_front, false);
                show(v, R.id.rb_a, false);
                show(v, R.id.rb_b, false);
                show(v, R.id.rb_hint, false);
                show(v, R.id.rb_grades, false);
                show(v, R.id.rb_msg, true);
                v.setTextViewText(R.id.rb_msg, msg);
                show(v, R.id.rb_actions, true);
                show(v, R.id.rb_more, more);
                v.setTextViewText(R.id.rb_more, r.getString(R.string.rb_more));
                v.setOnClickPendingIntent(R.id.rb_more, act(c, id, A_MORE, 6, -1, ""));
                v.setTextViewText(R.id.rb_open, r.getString(R.string.rb_open));
                v.setOnClickPendingIntent(R.id.rb_open, TodayWidget.open(c, "study"));
                v.setOnClickPendingIntent(R.id.rb_body, TodayWidget.open(c, "study"));
                v.setContentDescription(R.id.rb_body, msg);
            }
            return v;
        }
    }
}
