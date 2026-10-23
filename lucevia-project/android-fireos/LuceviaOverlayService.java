package com.amazon.hackathon.lucevia;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.IBinder;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import java.util.List;

/**
 * LuceviaOverlayService
 * 
 * Attaches a translucent system overlay view on Fire OS using WindowManager.
 * Floats seamlessly on top of running third-party streaming apps (YouTube, Netflix, Prime Video, MX Player)
 * when invoked via the Fire TV remote control.
 * 
 * Uses Fire OS MediaSessionManager to extract real-time playback title and timestamp
 * from the active foreground streaming player.
 */
public class LuceviaOverlayService extends Service {

    private WindowManager windowManager;
    private MediaSessionManager mediaSessionManager;
    private View overlayView;
    private WebView webView;
    private boolean isOverlayVisible = false;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        mediaSessionManager = (MediaSessionManager) getSystemService(Context.MEDIA_SESSION_SERVICE);
        setupOverlay();
    }

    /**
     * Extracts active media session context (Title, Current Playback Position) from Fire OS
     */
    private String extractActiveMediaContextJson() {
        try {
            if (mediaSessionManager != null) {
                List<MediaController> controllers = mediaSessionManager.getActiveSessions(null);
                if (controllers != null && !controllers.isEmpty()) {
                    MediaController active = controllers.get(0);
                    MediaMetadata meta = active.getMetadata();
                    PlaybackState state = active.getPlaybackState();

                    String title = meta != null ? meta.getString(MediaMetadata.METADATA_KEY_TITLE) : "Active Video Stream";
                    long positionMs = state != null ? state.getPosition() : 0;
                    long sec = positionMs / 1000;
                    String formattedTime = String.format("%02d:%02d", sec / 60, sec % 60);

                    return String.format("{\"title\":\"%s\",\"currentTime\":\"%s\"}", title, formattedTime);
                }
            }
        } catch (SecurityException e) {
            // Requires MEDIA_CONTENT_CONTROL or notification listener permission on Fire OS
        }
        return "{\"title\":\"Active Stream\",\"currentTime\":\"\"}";
    }

    private void setupOverlay() {
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP | Gravity.START;

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setBackgroundColor(0x00000000); // Fully transparent backdrop

        // Load the local Lucevia TV Agent Web Layer
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("http://127.0.0.1:4173/");

        overlayView = webView;
        overlayView.setVisibility(View.GONE);
        windowManager.addView(overlayView, params);
    }

    public void toggleOverlay() {
        if (overlayView == null) return;
        isOverlayVisible = !isOverlayVisible;
        overlayView.setVisibility(isOverlayVisible ? View.VISIBLE : View.GONE);
        if (isOverlayVisible) {
            webView.requestFocus();
            String contextJson = extractActiveMediaContextJson();
            webView.evaluateJavascript(String.format("window.postMessage({ type: 'LUCEVIA_SYNC_MEDIA', data: %s }, '*');", contextJson), null);
            webView.evaluateJavascript("window.postMessage({ type: 'LUCEVIA_TRIGGER' }, '*');", null);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "TOGGLE_OVERLAY".equals(intent.getAction())) {
            toggleOverlay();
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (overlayView != null && windowManager != null) {
            windowManager.removeView(overlayView);
        }
    }
}
