# LUCEVIA-Amazon-Developer-Hackathon
View Beyond What You See...!
# ✦ Lucevia — Fire TV & Vega OS Live AI Comprehension Companion

> **Amazon Build, Ship, Shape Fire TV Hackathon**  
> TV-native ambient AI comprehension companion powered strictly by **Google Gemini LLM** for real-time video understanding on streaming television (Netflix, YouTube, Prime Video, educational lectures, and live broadcasts).

---

## 1. Product Vision & Architecture

**Lucevia is an ambient AI agent for Amazon Fire TV (Fire OS & Vega OS)**, operating like the **"Ask Gemini"** button in Google Chrome:
- When a viewer is watching any video on television (educational lecture, science documentary, news/political debate, movie, sports tactics, spiritual talk, or drama), they can pause at any timestamp (e.g. `01:20`, `02:20`, or any random moment) and click **"✦ Ask Lucevia AI"** in the top right corner (or press `[H]` / `[Select]` on the Fire TV remote).
- The Lucevia Agent slides out as an executive luxury side panel without interrupting playback context:
  1. **Direct Timestamp & Video Synchronization**: Recognizes what is playing and the exact playback time.
  2. **Multimodal Screen Vision**: Captures the exact video frame at the paused moment and passes the visual image directly into Google Gemini for deep scene, diagram, and equation comprehension.
  3. **YouTube URL Deep Grounding**: Automatically fetches verified video metadata and thumbnail previews via YouTube oEmbed to ground answers directly in the real video's subject matter.
  4. **Substantive Real-Time Gemini Inference**:
     - **Explain simply**: Delivers a deep, grounded explanation of the real subject matter (physics, economics, legal statutes, tactics, historical context) and a relatable real-world analogy.
     - **Show visually**: Renders an interactive structured visual conceptual flow / mental model.
     - **Check understanding**: A sharp, topic-specific multiple-choice question with instant feedback and rationale.
     - **Ask Anything**: The viewer can type or speak any custom question about the scene, and Gemini answers in real time.
  5. **Resume Playback**: Pressing `[Resume]` or `[Esc]` smoothly hides the agent and continues playback.

---

## 2. Key Features

- **Multimodal Video Frame Vision**: Automatically captures the active canvas video frame at the current timestamp, sending it as base64 `inlineData` to Gemini for visual screen analysis.
- **YouTube Video Grounding**: Resolves YouTube URLs, fetches public oEmbed metadata (title, channel, thumbnail image), and answers specifically about that video without canned text or generic algorithm explanations.
- **Dynamic Playback Inputs**: Supports both local file upload (`.mp4`, `.mov`, `.webm`) and live streaming YouTube URLs.
- **10-Foot Leanback Television UI**:
  - **60% Dominant Foundation**: Deep Obsidian Black & Midnight Space Navy (`#040711`, `#070c1a`).
  - **30% Secondary Panels**: Refined Slate Frosted Glass (`rgba(17, 26, 44, 0.86)`) with 40px backdrop blur, subtle borders, and smooth vertical scrolling with **zero text clipping**.
  - **10% Accent**: Warm Champagne Gold (`#f5c96a`, `#ffe29a`) for focus rings, glowing star motif (`✦`), and active selections.
- **Fire OS & Vega OS Native Readiness**: Ready-to-deploy accessibility service, system overlay service, and React Native IPC bridge for TV OS-level integration.

---

## 3. Project Structure

Code Antigravity/ ├── .env.example ← Example environment variables template ├── .gitignore ← Standard Git ignore rules ├── package.json ← Project scripts and configuration ├── package-lock.json ← Locked dependency tree ├── README.md ← Project overview and documentation ├── Lucevia_Hackathon_Implementation_Plan.pdf ← Complete architectural specification ├── server/ │ └── index.js ← Node.js backend (Gemini API + oEmbed + static server) ├── public/ │ ├── index.html ← TV-first single page interface │ ├── styles.css ← Luxury dark 60:30:10 TV design system │ ├── app.js ← Client state, video frame capture, and agent logic │ └── assets/ │ ├── lucevia-logo.png ← Official Lucevia logo wordmark │ └── lucevia-star.png ← Warm gold star emblem ├── test/ │ └── smoke.test.js ← Automated test suite (Gemini vision & YouTube grounding) ├── android-fireos/ ← Native Fire OS integration │ ├── AndroidManifest.xml ← System overlay and accessibility service manifest │ ├── LuceviaOverlayService.java ← TYPE_APPLICATION_OVERLAY system window manager │ └── LuceviaAccessibilityService.java ← Remote control key interceptor └── vega-os/ ← Native Vega OS integration ├── app-manifest.json ← Vega OS application definition └── vega-bridge.js ← React Native IPC event bridge



