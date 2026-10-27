package it.mandarino.app;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Solo debug. Disegna i widget «Oggi» (grande, stretto, piccolo) con uno stato di prova, dentro una finestra, per le
 * schermate della pull request (tools/widget-shots.sh). Uso: am start -n it.mandarino.app/.WidgetPreview --es lang zh
 * Il tema chiaro/scuro è quello del sistema (cmd uimode night yes|no).
 */
public class WidgetPreview extends Activity {
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        String lang = getIntent().getStringExtra("lang");
        if (lang == null) lang = "it";
        demo(this, lang);
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setGravity(Gravity.CENTER_HORIZONTAL);
        col.setBackgroundColor(Color.rgb(96, 120, 132));   /* uno sfondo qualsiasi, come uno sfondo del telefono */
        col.setPadding(0, dp(48), 0, 0);
        add(col, new TodayWidget().views(this), 340, 140);
        add(col, new TodayWidgetSmall().views(this), 160, 76);
        setContentView(col);
    }

    void add(LinearLayout col, RemoteViews rv, int w, int h) {
        FrameLayout f = new FrameLayout(this);
        View v = rv.apply(this, f);
        f.addView(v, new FrameLayout.LayoutParams(dp(w), dp(h)));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(w), dp(h));
        lp.topMargin = dp(16);
        col.addView(f, lp);
    }

    int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }

    static void demo(Context c, String lang) {
        try {
            long now = System.currentTimeMillis();
            JSONObject o = new JSONObject();
            o.put("t", now).put("t0", now / 3600000L * 3600000L).put("over", 7).put("hist", new JSONArray())
                    .put("nw", 12).put("goal", 10).put("today", false).put("streak", 12).put("lang", lang);
            JSONArray words = new JSONArray();
            if (lang.equals("zh")) words.put(new JSONArray().put("grazie").put("gràtsie").put("谢谢"));
            else words.put(new JSONArray().put("谢谢").put("xiexie").put("grazie"));
            o.put("words", words);
            c.getSharedPreferences(WidgetState.PREFS, Context.MODE_PRIVATE).edit()
                    .putString("widget", o.toString()).putInt("reveal", TodayWidget.today()).apply();
        } catch (Exception ignored) { }
    }
}
