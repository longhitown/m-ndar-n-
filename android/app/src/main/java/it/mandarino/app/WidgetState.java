package it.mandarino.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.content.res.Resources;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.Locale;

/**
 * Lo stato del widget «Oggi», come l'ha mandato la pagina (pwa/widget.js → Bridge.setWidgetState) e come vale ADESSO:
 * i ripassi scaduti si calcolano dall'istogramma delle scadenze (168 ore), la serie di giorni si aggiorna se nel frattempo
 * è passata la mezzanotte, la parola del giorno si sceglie dalla lista con il giorno dell'anno. Nessuna rete, nessun server.
 */
final class WidgetState {
    static final String PREFS = "mandarino";
    private static final long H = 3600000L;

    int due, fresh, streak, goal, wt;
    boolean activeToday, empty = true;
    String lang = "it", hz = "", py = "", it = "", rank = "";
    /** i testi stanno in res/values (it) e res/values-zh: nella lingua del corso scelta nell'app, non in quella del telefono */
    Resources r;

    static WidgetState load(Context c) {
        WidgetState w = new WidgetState();
        w.r = c.getResources();
        SharedPreferences p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String json = p.getString("widget", null);
        if (json == null) return w;
        try {
            JSONObject o = new JSONObject(json);
            long now = System.currentTimeMillis(), t0 = o.optLong("t0"), t = o.optLong("t");
            w.empty = false;
            w.lang = o.optString("lang", "it");
            w.fresh = o.optInt("nw");
            w.goal = o.optInt("goal", 10);
            int due = o.optInt("over");
            JSONArray hist = o.optJSONArray("hist");
            if (hist != null) for (int i = 0; i < hist.length(); i++) if (t0 + i * H <= now) due += hist.optInt(i);
            w.due = due;
            /* serie di giorni: com'era quando l'app l'ha mandata, spostata a oggi */
            int gap = daysBetween(t, now);
            boolean was = o.optBoolean("today");
            int s = o.optInt("streak");
            w.rank = o.optString("rank", "");
            w.wt = gap <= 0 ? o.optInt("wt") : 0;
            if (gap <= 0) { w.streak = s; w.activeToday = was; }
            else if (gap == 1 && was) { w.streak = s; w.activeToday = false; }
            else { w.streak = 0; w.activeToday = false; }
            JSONArray words = o.optJSONArray("words");
            if (words != null && words.length() > 0) {
                Calendar cal = Calendar.getInstance();
                int idx = (cal.get(Calendar.YEAR) * 366 + cal.get(Calendar.DAY_OF_YEAR)) % words.length();
                JSONArray x = words.optJSONArray(idx);
                if (x != null) { w.hz = x.optString(0); w.py = x.optString(1); w.it = x.optString(2); }
            }
        } catch (Exception e) { w.empty = true; }
        w.r = localized(c, w.lang);
        return w;
    }

    static Resources localized(Context c, String lang) {
        Configuration cfg = new Configuration(c.getResources().getConfiguration());
        cfg.setLocale(new Locale("zh".equals(lang) ? "zh" : "it"));
        return c.createConfigurationContext(cfg).getResources();
    }

    static int daysBetween(long a, long b) {
        Calendar x = Calendar.getInstance(), y = Calendar.getInstance();
        x.setTimeInMillis(a); y.setTimeInMillis(b);
        int d = 0;
        if (x.after(y)) return 0;
        while (x.get(Calendar.YEAR) != y.get(Calendar.YEAR) || x.get(Calendar.DAY_OF_YEAR) != y.get(Calendar.DAY_OF_YEAR)) { x.add(Calendar.DAY_OF_YEAR, 1); d++; if (d > 400) break; }
        return d;
    }

    boolean zh() { return "zh".equals(lang); }

    private String days(int n) { return r.getQuantityString(R.plurals.w_days, n, n); }

    /** la riga della serie: un messaggio gentile, non solo un numero */
    String streakLine() {
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        if (empty) return r.getString(R.string.w_open_app);
        if (activeToday) return r.getString(R.string.w_msg_done, days(streak));
        if (streak > 0 && hour >= 18) return r.getString(R.string.w_msg_evening, days(streak));
        if (streak > 0) return r.getString(R.string.w_msg_keep, days(streak));
        return r.getString(R.string.w_msg_restart);
    }

    /** la serie in poco spazio (widget piccolo) */
    String streakShort() {
        if (empty || streak == 0) return r.getString(R.string.w_short_restart);
        return activeToday ? r.getString(R.string.w_short_done, days(streak)) : days(streak);
    }

    /** il grande numero: ripassi scaduti, «✓» se è tutto in ordine, «—» se l'app non ha ancora mandato nulla */
    String dueNumber() { return empty ? "—" : due > 0 ? String.valueOf(due) : "✓"; }
    String dueLabel() { return due > 0 ? r.getQuantityString(R.plurals.w_reviews, due) : r.getString(R.string.w_label_ok); }

    /** sotto il numero: il tempo stimato, o le parole nuove, o niente */
    String dueDetail() {
        if (empty) return "";
        if (due > 0) return r.getString(R.string.w_minutes, Math.max(1, Math.round(due * 20f / 60f)));
        if (fresh > 0) return r.getQuantityString(R.plurals.w_fresh, fresh, fresh);
        return r.getString(R.string.w_all_ok);
    }

    String study() { return r.getString(R.string.w_study); }
    String tapMeaning() { return r.getString(R.string.w_tap_meaning); }

    /* ===== le quattro «atmosfere» del giorno: mattina 6–11, pomeriggio 12–16, sera 17–21, notte 22–5 ===== */
    static final int MORNING = 0, AFTERNOON = 1, EVENING = 2, NIGHT = 3;

    static int band(int hour) { return hour >= 22 || hour < 6 ? NIGHT : hour < 12 ? MORNING : hour < 17 ? AFTERNOON : EVENING; }
    static int band() { return band(Calendar.getInstance().get(Calendar.HOUR_OF_DAY)); }

    static int background(int band) {
        return band == MORNING ? R.drawable.w_giada_morning : band == EVENING ? R.drawable.w_giada_evening : band == NIGHT ? R.drawable.w_giada_night : R.drawable.w_giada_afternoon;
    }

    /** il prossimo cambio di fascia (millisecondi), per far ridisegnare i widget senza che l'app sia aperta */
    static long nextBandChange() {
        Calendar c = Calendar.getInstance();
        int h = c.get(Calendar.HOUR_OF_DAY);
        int[] edges = {6, 12, 17, 22};
        int next = -1;
        for (int e : edges) if (e > h) { next = e; break; }
        c.set(Calendar.MINUTE, 0); c.set(Calendar.SECOND, 5); c.set(Calendar.MILLISECOND, 0);
        if (next < 0) { c.add(Calendar.DAY_OF_YEAR, 1); next = 6; }
        c.set(Calendar.HOUR_OF_DAY, next);
        return c.getTimeInMillis();
    }

    private int minutes() { return Math.max(1, Math.round(due * 20f / 60f)); }

    private String pick(int array, int salt) {
        String[] a = r.getStringArray(array);
        int d = Calendar.getInstance().get(Calendar.DAY_OF_YEAR);
        return a[Math.abs(d * 7 + salt) % a.length];
    }

    /** il messaggio breve in alto: cambia con la fascia e ruota di giorno in giorno; niente toni ansiosi */
    String microCopy(int band) {
        if (empty) return r.getString(R.string.w_open_app);
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        switch (band) {
            case MORNING: return pick(R.array.w_g_morning, 0);
            case AFTERNOON:
                if (due <= 0) return r.getString(R.string.w_all_ok);
                return hour % 2 == 0 ? r.getQuantityString(R.plurals.w_g_pause_n, minutes(), minutes()) : r.getQuantityString(R.plurals.w_g_reviews_min, due, due, minutes());
            case EVENING:
                if (goal - wt > 0 && hour % 2 == 1) return r.getQuantityString(R.plurals.w_g_missing, goal - wt, goal - wt);
                return pick(R.array.w_g_evening, 0);
            default: return activeToday || wt > 0 ? r.getString(R.string.w_g_night_done) : r.getString(R.string.w_g_night_none);
        }
    }

    /** il proverbio della sera: {testo, seconda riga} */
    String[] proverb() {
        String[] x = pick(R.array.w_g_proverbs, 3).split("\\|", 2);
        return new String[]{x[0], x.length > 1 ? x[1] : ""};
    }

    /** quanti dei dieci segmenti dell'obiettivo sono pieni */
    int segments() { return goal <= 0 ? 0 : Math.min(10, Math.round(wt * 10f / goal)); }

    String startLabel(int band) { return band == MORNING ? r.getString(R.string.w_g_start) : study(); }
}
