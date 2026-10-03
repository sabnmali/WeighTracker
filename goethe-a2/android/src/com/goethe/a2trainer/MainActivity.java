package com.goethe.a2trainer;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Iterator;
import java.util.Locale;

public class MainActivity extends Activity {

    private static final int REQ_FILE_CHOOSER = 1001;
    private static final int REQ_CREATE_DOCUMENT = 1002;

    private WebView webView;
    private TextToSpeech tts;
    private volatile boolean ttsReady = false;
    private volatile String ttsStatus = "init";
    private ValueCallback<Uri[]> filePathCallback;
    private String pendingSaveContent;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setBackgroundColor(getResources().getColor(R.color.bg));
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.addJavascriptInterface(new Bridge(), "AndroidBridge");

        webView.setWebViewClient(new WebViewClient() {
            // API 24+ sürümü varsayılan olarak bu metoda yönlenir.
            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleExternal(Uri.parse(url));
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                try {
                    startActivityForResult(Intent.createChooser(intent, "Dosya seç"), REQ_FILE_CHOOSER);
                } catch (ActivityNotFoundException e) {
                    filePathCallback = null;
                    return false;
                }
                return true;
            }
        });

        initTts();

        // Tüm uygulama durumu localStorage'da tutulur; sayfayı her zaman baştan yüklemek güvenlidir.
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) webView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    private boolean handleExternal(Uri uri) {
        String scheme = uri.getScheme();
        if ("http".equals(scheme) || "https".equals(scheme) || "mailto".equals(scheme)) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (ActivityNotFoundException ignored) {
            }
            return true;
        }
        return false;
    }

    private void initTts() {
        tts = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            @Override
            public void onInit(int status) {
                if (status != TextToSpeech.SUCCESS) {
                    ttsStatus = "engine_error";
                    return;
                }
                int r = tts.setLanguage(Locale.GERMANY);
                if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
                    r = tts.setLanguage(Locale.GERMAN);
                }
                if (r == TextToSpeech.LANG_MISSING_DATA) {
                    ttsStatus = "missing_data";
                } else if (r == TextToSpeech.LANG_NOT_SUPPORTED) {
                    ttsStatus = "not_supported";
                } else {
                    ttsStatus = "ready";
                    ttsReady = true;
                }
            }
        });
    }

    @Override
    public void onBackPressed() {
        webView.evaluateJavascript("(window.__handleBack && window.__handleBack()) ? 'handled' : 'exit'",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        if (value == null || !value.contains("handled")) {
                            MainActivity.super.onBackPressed();
                        }
                    }
                });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_FILE_CHOOSER) {
            if (filePathCallback != null) {
                Uri[] result = null;
                if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                    result = new Uri[]{data.getData()};
                }
                filePathCallback.onReceiveValue(result);
                filePathCallback = null;
            }
        } else if (requestCode == REQ_CREATE_DOCUMENT) {
            String content = pendingSaveContent;
            pendingSaveContent = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null && content != null) {
                try {
                    OutputStream os = getContentResolver().openOutputStream(data.getData());
                    if (os != null) {
                        os.write(content.getBytes("UTF-8"));
                        os.close();
                    }
                    notifyJs("window.__onNativeSave && window.__onNativeSave(true)");
                } catch (Exception e) {
                    notifyJs("window.__onNativeSave && window.__onNativeSave(false)");
                }
            } else {
                notifyJs("window.__onNativeSave && window.__onNativeSave(false)");
            }
        }
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    private void notifyJs(final String script) {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                if (webView != null) {
                    webView.evaluateJavascript(script, null);
                }
            }
        });
    }

    private static String readStream(InputStream in) throws Exception {
        if (in == null) return "";
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) > 0) {
            bos.write(buf, 0, n);
        }
        in.close();
        return bos.toString("UTF-8");
    }

    public class Bridge {

        @JavascriptInterface
        public boolean isNative() {
            return true;
        }

        @JavascriptInterface
        public String getAppVersion() {
            return "3.0.0";
        }

        @JavascriptInterface
        public String ttsStatus() {
            return ttsStatus;
        }

        @JavascriptInterface
        public boolean speak(String text, float rate) {
            if (!ttsReady || tts == null) return false;
            tts.setSpeechRate(rate <= 0 ? 0.9f : rate);
            if (Build.VERSION.SDK_INT >= 21) {
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "utt" + System.currentTimeMillis());
            }
            return true;
        }

        @JavascriptInterface
        public void stopSpeaking() {
            if (tts != null) tts.stop();
        }

        @JavascriptInterface
        public void openTtsSettings() {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    try {
                        Intent i = new Intent();
                        i.setAction(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
                        startActivity(i);
                    } catch (Exception e) {
                        try {
                            startActivity(new Intent("com.android.settings.TTS_SETTINGS"));
                        } catch (Exception ignored) {
                            Toast.makeText(MainActivity.this, "TTS ayarları açılamadı", Toast.LENGTH_SHORT).show();
                        }
                    }
                }
            });
        }

        @JavascriptInterface
        public void toast(final String msg) {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void copyText(String text) {
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null) {
                cm.setPrimaryClip(ClipData.newPlainText("text", text));
            }
        }

        @JavascriptInterface
        public void shareText(final String title, final String text) {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    Intent i = new Intent(Intent.ACTION_SEND);
                    i.setType("text/plain");
                    i.putExtra(Intent.EXTRA_SUBJECT, title);
                    i.putExtra(Intent.EXTRA_TEXT, text);
                    try {
                        startActivity(Intent.createChooser(i, title));
                    } catch (Exception ignored) {
                    }
                }
            });
        }

        @JavascriptInterface
        public void saveFile(final String fileName, final String mime, final String content) {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    pendingSaveContent = content;
                    Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType(mime);
                    i.putExtra(Intent.EXTRA_TITLE, fileName);
                    try {
                        startActivityForResult(i, REQ_CREATE_DOCUMENT);
                    } catch (Exception e) {
                        pendingSaveContent = null;
                        Toast.makeText(MainActivity.this, "Dosya kaydedilemedi", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        @JavascriptInterface
        public void printPage(final String jobName) {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    if (pm == null) return;
                    PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(jobName);
                    pm.print(jobName, adapter, new PrintAttributes.Builder()
                            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                            .build());
                }
            });
        }

        @JavascriptInterface
        public void httpRequest(final String id, final String method, final String url,
                                final String headersJson, final String body) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    int status = 0;
                    String resp;
                    HttpURLConnection conn = null;
                    try {
                        conn = (HttpURLConnection) new URL(url).openConnection();
                        conn.setRequestMethod(method);
                        conn.setConnectTimeout(20000);
                        conn.setReadTimeout(120000);
                        if (headersJson != null && headersJson.length() > 0) {
                            JSONObject h = new JSONObject(headersJson);
                            Iterator<String> keys = h.keys();
                            while (keys.hasNext()) {
                                String k = keys.next();
                                conn.setRequestProperty(k, h.getString(k));
                            }
                        }
                        if (body != null && body.length() > 0) {
                            conn.setDoOutput(true);
                            OutputStream os = conn.getOutputStream();
                            os.write(body.getBytes("UTF-8"));
                            os.close();
                        }
                        status = conn.getResponseCode();
                        InputStream is = status >= 400 ? conn.getErrorStream() : conn.getInputStream();
                        resp = readStream(is);
                    } catch (Exception e) {
                        status = 0;
                        resp = String.valueOf(e.getMessage());
                    } finally {
                        if (conn != null) conn.disconnect();
                    }
                    final String script = "window.__nativeHttpCallback && window.__nativeHttpCallback("
                            + JSONObject.quote(id) + "," + status + "," + JSONObject.quote(resp) + ")";
                    notifyJs(script);
                }
            }).start();
        }
    }
}
