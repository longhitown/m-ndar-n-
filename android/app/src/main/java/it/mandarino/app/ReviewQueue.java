package it.mandarino.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * La coda dei voti dati nel widget «Ripasso rapido» (ReviewBigWidget). Il widget non ha il motore FSRS: ogni voto resta qui
 * (id unico, chiave della carta, voto 0-3, ora in millisecondi, corso) e l'app li applica alla prossima apertura
 * (pwa/widget.js → pwa/wq.js) con l'ora originale del voto; solo dopo averli applicati li toglie con widgetAck.
 * Tutto in un SharedPreferences privato, mai in rete. Il widget gira sul thread principale e il ponte su quello di JavaScript:
 * ogni accesso passa da LOCK.
 */
final class ReviewQueue {
    static final String PREFS = "mandarino_ripasso";
    /** chiude l'accesso alla coda, ai voti recenti e allo stato della sessione del widget */
    static final Object LOCK = new Object();
    private static final String Q = "q", RV = "rv";
    private static final int MAX_QUEUE = 500, MAX_RECENT = 200;
    private static final long DAY = 86400000L;

    private ReviewQueue() { }

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    /** un voto: va in coda (per l'app) e tra i recenti (perché il widget non riproponga la carta finché l'app non ha mandato un nuovo stato) */
    static void addVote(Context c, String key, int grade, String course, long t) {
        synchronized (LOCK) {
            SharedPreferences p = prefs(c);
            try {
                JSONObject o = new JSONObject();
                o.put("id", UUID.randomUUID().toString());
                o.put("k", key);
                o.put("g", grade);
                o.put("t", t);
                o.put("c", course);
                JSONArray q = tail(new JSONArray(p.getString(Q, "[]")), MAX_QUEUE - 1);
                q.put(o);
                JSONArray old = new JSONArray(p.getString(RV, "[]"));
                JSONArray fresh = new JSONArray();
                for (int i = 0; i < old.length(); i++) {
                    JSONObject x = old.optJSONObject(i);
                    if (x != null && t - x.optLong("t") < DAY) fresh.put(x);
                }
                JSONArray rv = tail(fresh, MAX_RECENT - 1);
                JSONObject r = new JSONObject();
                r.put("k", key);
                r.put("t", t);
                rv.put(r);
                p.edit().putString(Q, q.toString()).putString(RV, rv.toString()).apply();
            } catch (Exception ignored) { }
        }
    }

    /** chiave della carta → ora dell'ultimo voto dato nel widget (ultime 24 ore) */
    static Map<String, Long> recent(Context c) {
        Map<String, Long> m = new HashMap<>();
        synchronized (LOCK) {
            try {
                JSONArray rv = new JSONArray(prefs(c).getString(RV, "[]"));
                for (int i = 0; i < rv.length(); i++) {
                    JSONObject x = rv.optJSONObject(i);
                    if (x == null) continue;
                    String k = x.optString("k");
                    long t = x.optLong("t");
                    Long old = m.get(k);
                    if (old == null || old < t) m.put(k, t);
                }
            } catch (Exception ignored) { }
        }
        return m;
    }

    /** la coda come testo JSON per l'app (Bridge.widgetPending); stringa vuota se non c'è niente */
    static String pending(Context c) {
        synchronized (LOCK) {
            String s = prefs(c).getString(Q, "[]");
            return s == null || "[]".equals(s) ? "" : s;
        }
    }

    /** toglie dalla coda i voti con questi id (testo JSON: ["id", …]); l'app li ha applicati (Bridge.widgetAck) */
    static void ack(Context c, String idsJson) {
        synchronized (LOCK) {
            try {
                JSONArray ids = new JSONArray(idsJson);
                Set<String> gone = new HashSet<>();
                for (int i = 0; i < ids.length(); i++) gone.add(ids.optString(i));
                JSONArray q = new JSONArray(prefs(c).getString(Q, "[]"));
                JSONArray keep = new JSONArray();
                for (int i = 0; i < q.length(); i++) {
                    JSONObject o = q.optJSONObject(i);
                    if (o != null && !gone.contains(o.optString("id"))) keep.put(o);
                }
                prefs(c).edit().putString(Q, keep.toString()).apply();
            } catch (Exception ignored) { }
        }
    }

    private static JSONArray tail(JSONArray a, int keep) {
        if (a.length() <= keep) return a;
        JSONArray out = new JSONArray();
        for (int i = a.length() - keep; i < a.length(); i++) out.put(a.opt(i));
        return out;
    }
}
