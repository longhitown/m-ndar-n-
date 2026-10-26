package it.mandarino.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

/**
 * Lo stato del widget «Oggi», come l'ha mandato la pagina (pwa/widget.js → Bridge.setWidgetState) e come vale ADESSO:
 * i ripassi scaduti si calcolano dall'istogramma delle scadenze (168 ore), la serie di giorni si aggiorna se nel frattempo
 * è passata la mezzanotte, la parola del giorno si sceglie dalla lista con il giorno dell'anno. Nessuna rete, nessun server.
 */
final class WidgetState {
    static final String PREFS = "mandarino";
    private static final long H = 3600000L;

    int due, fresh, streak, goal;
    boolean activeToday, empty = true;
    String lang = "it", hz = "", py = "", it = "";

    static WidgetState load(Context c) {
        WidgetState w = new WidgetState();
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
        return w;
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

    /** la riga della serie: un messaggio gentile, non solo un numero */
    String streakLine() {
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        if (empty) return zh() ? "打开应用开始学习" : "Apri l'app per cominciare";
        if (activeToday) return zh() ? "🔥 连续 " + streak + " 天 · 今天完成 ✓" : "🔥 " + streak + (streak == 1 ? " giorno" : " giorni") + " di fila · oggi fatto ✓";
        if (streak > 0 && hour >= 18) return zh() ? "🔥 连续 " + streak + " 天：今晚学 3 分钟就不会中断" : "🔥 " + streak + (streak == 1 ? " giorno" : " giorni") + ": stasera bastano 3 minuti per non spezzarla";
        if (streak > 0) return zh() ? "🔥 连续 " + streak + " 天：今天继续" : "🔥 " + streak + (streak == 1 ? " giorno" : " giorni") + " di fila: continua oggi";
        return zh() ? "今天学一张卡片，连续天数重新开始" : "Una carta oggi e la serie riparte";
    }

    String dueLine() {
        if (empty) return "";
        if (due > 0) { int m = Math.max(1, Math.round(due * 20f / 60f)); return zh() ? due + " 个复习 · 约 " + m + " 分钟" : due + (due == 1 ? " ripasso" : " ripassi") + " · ~" + m + " min"; }
        if (fresh > 0) return zh() ? fresh + " 个新词等你学" : fresh + " parole nuove pronte";
        return zh() ? "暂时都复习完了" : "Tutto in ordine per ora";
    }

    String shortDue() { return empty ? "—" : due > 0 ? String.valueOf(due) : "✓"; }
    String shortDueLabel() { return zh() ? (due > 0 ? "个复习" : "已完成") : (due > 0 ? (due == 1 ? "ripasso" : "ripassi") : "in ordine"); }
    String title() { return zh() ? "màndarínō · 今天" : "màndarínō · Oggi"; }
    String study() { return zh() ? "现在学习" : "Studia ora"; }
    String tapMeaning() { return zh() ? "点一下看意思" : "Tocca per il significato"; }
    String wordLabel() { return zh() ? "今日一词" : "Parola del giorno"; }
}
