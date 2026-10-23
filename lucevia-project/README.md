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

```
Code Antigravity/
├── .env.example                          ← Example environment variables template
├── .gitignore                            ← Standard Git ignore rules
├── package.json                          ← Project scripts and configuration
├── package-lock.json                     ← Locked dependency tree
├── README.md                             ← Project overview and documentation
├── Lucevia_Hackathon_Implementation_Plan.pdf ← Complete architectural specification
├── server/
│   └── index.js                          ← Node.js backend (Gemini API + oEmbed + static server)
├── public/
│   ├── index.html                        ← TV-first single page interface
│   ├── styles.css                        ← Luxury dark 60:30:10 TV design system
│   ├── app.js                            ← Client state, video frame capture, and agent logic
│   └── assets/
│       ├── lucevia-logo.png              ← Official Lucevia logo wordmark
│       └── lucevia-star.png              ← Warm gold star emblem
├── test/
│   └── smoke.test.js                     ← Automated test suite (Gemini vision & YouTube grounding)
├── android-fireos/                       ← Native Fire OS integration
│   ├── AndroidManifest.xml               ← System overlay and accessibility service manifest
│   ├── LuceviaOverlayService.java        ← TYPE_APPLICATION_OVERLAY system window manager
│   └── LuceviaAccessibilityService.java  ← Remote control key interceptor
└── vega-os/                              ← Native Vega OS integration
    ├── app-manifest.json                 ← Vega OS application definition
    └── vega-bridge.js                    ← React Native IPC event bridge
```

---

## 4. Setup & Running

### Prerequisites
- Node.js 18+ installed on your machine.
- Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Copy the example file and add your Gemini API key:
```bash
cp .env.example .env
```
Inside `.env`, configure:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
PORT=4173
```

### Step 3: Run the Automated Tests
Verify that the server, YouTube URL resolver, and video frame vision inference pass:
```bash
npm test
```

### Step 4: Start the Server
```bash
npm start
```
Open **`http://127.0.0.1:4173`** in Google Chrome or any browser (or the Fire TV Silk browser).

---

## 5. How to Demo

1. **Option A: Test with a YouTube Video**
   - Click **`🔗 YouTube URL`** in the top bar.
   - Enter any YouTube link (e.g. `https://www.youtube.com/watch?v=aircAruvnKk`).
   - Click **Load & Play**.
   - Pause at any timestamp and click **`✦ Ask Lucevia AI`**.
   - Gemini will identify the exact video, title, and topic and provide domain explanations, analogies, diagrams, and quizzes.

2. **Option B: Test with a Local Video File**
   - Click **`📁 Load Video File`**.
   - Choose any `.mp4`, `.mov`, or `.webm` file from your device.
   - Pause at any point and click **`✦ Ask Lucevia AI`**.
   - Lucevia captures the video frame, scans the screen visuals with Gemini multimodal vision, and answers based on what is shown on screen.

3. **Option C: Ask Any Custom Question**
   - In the Lucevia Agent side panel, type any specific question into the input box (e.g., *"What does this formula mean?"* or *"Who is speaking and why?"*) and press Enter.

---

## 6. OS-Level Native Implementations

- **Fire OS (Android / AOSP)**:
  - Located in `android-fireos/`.
  - Implements `LuceviaOverlayService` via `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY` to render over third-party apps like Netflix or Prime Video.
  - Implements `LuceviaAccessibilityService` to listen for remote control key events (e.g. `KEYCODE_BUTTON_AI`, long-press Select, or Alexa voice trigger) to open the companion without leaving the streaming app.
- **Vega OS (Linux / React Native)**:
  - Located in `vega-os/`.
  - Implements `vega-bridge.js` to establish IPC communication between the Vega OS display manager and the Lucevia inference agent.

---

## 7. License & Credits

Built for the **Amazon Build, Ship, Shape Fire TV Hackathon**  
Powered by **Google Gemini Multimodal API**
