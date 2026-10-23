package com.amazon.hackathon.lucevia;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityEvent;

/**
 * LuceviaAccessibilityService
 * 
 * Intercepts Fire TV remote key events across any running app (YouTube, Netflix, Prime Video, MX Player).
 * When the designated hotkey (e.g. Media Info, Help, or Long-press Select) is detected,
 * triggers the LuceviaOverlayService to display the comprehension companion.
 */
public class LuceviaAccessibilityService extends AccessibilityService {

    @Override
    protected boolean onKeyEvent(KeyEvent event) {
        int action = event.getAction();
        int keyCode = event.getKeyCode();

        // Check for Fire TV remote trigger key (e.g. KEYCODE_INFO, KEYCODE_GUIDE, or KEYCODE_SEARCH)
        if (action == KeyEvent.ACTION_DOWN) {
            if (keyCode == KeyEvent.KEYCODE_INFO || 
                keyCode == KeyEvent.KEYCODE_GUIDE || 
                keyCode == KeyEvent.KEYCODE_CAPTIONS) {
                
                Intent trigger = new Intent(this, LuceviaOverlayService.class);
                trigger.setAction("TOGGLE_OVERLAY");
                startService(trigger);
                return true; // Consume event
            }
        }
        return super.onKeyEvent(event);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Monitors foreground package names (e.g. com.google.android.youtube.tv, com.netflix.ninja)
    }

    @Override
    public void onInterrupt() {
    }
}
