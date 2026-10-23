/**
 * Lucevia — TV-Native Luxury AI Comprehension Agent
 * Powered by Google Gemini LLM API (Fire OS & Vega OS)
 */

// ---------------------------------------------------------------------------
// 1. Application State (No Hardcoded Timers)
// ---------------------------------------------------------------------------

const state = {
  videoTitle: "Live Video Stream",
  videoUrl: "",
  streamingPlatform: "Fire TV Stream",
  currentTime: "", // Dynamic live timestamp
  durationTime: "",
  isPlaying: false,
  isAgentOpen: false,
  activeMode: "explain", // "explain" | "visual" | "quiz"
  currentQuery: "",
  geminiData: null,
  isLoading: false,
  quizAnswer: null,
  quizOutcome: null,
  recapHistory: [],
  ytPlayer: null,
  ytTimer: null
};

// ---------------------------------------------------------------------------
// 2. DOM Elements
// ---------------------------------------------------------------------------

const el = {
  // Video surfaces
  nativeVideo: document.getElementById("tv-video-player"),
  ytContainer: document.getElementById("yt-player-container"),
  ambientPlaceholder: document.getElementById("ambient-placeholder"),
  filePicker: document.getElementById("local-file-input"),

  // Topbar badges & buttons
  streamTitleDisplay: document.getElementById("stream-title-display"),
  streamTimeDisplay: document.getElementById("stream-time-display"),
  streamSep: document.getElementById("stream-sep"),
  btnOpenFile: document.getElementById("btn-open-file"),
  btnOpenYt: document.getElementById("btn-open-yt"),
  btnTriggerAgent: document.getElementById("btn-trigger-agent"),

  // Placeholder actions
  btnPlaceholderFile: document.getElementById("btn-placeholder-file"),
  btnPlaceholderYt: document.getElementById("btn-placeholder-yt"),

  // Playback bar
  btnPlayPause: document.getElementById("btn-play-pause-toggle"),
  playbackIcon: document.getElementById("playback-icon"),
  lblTimeCur: document.getElementById("lbl-time-cur"),
  lblTimeDur: document.getElementById("lbl-time-dur"),
  lblVideoName: document.getElementById("lbl-current-video-name"),
  btnBottomAsk: document.getElementById("btn-bottom-ask"),

  // Agent Side Panel
  agentPanel: document.getElementById("lucevia-agent-panel"),
  btnCloseAgent: document.getElementById("btn-close-agent"),
  agentFocusTime: document.getElementById("agent-focus-time"),
  agentFocusTitle: document.getElementById("agent-focus-title"),
  agentQueryForm: document.getElementById("agent-query-form"),
  agentCustomQuery: document.getElementById("agent-custom-query"),
  suggestionChips: document.getElementById("suggestion-chips"),
  contentArea: document.getElementById("agent-content-area"),

  // Mode Tabs
  tabExplain: document.getElementById("tab-mode-explain"),
  tabVisual: document.getElementById("tab-mode-visual"),
  tabQuiz: document.getElementById("tab-mode-quiz"),

  // Agent Footer
  btnAgentResume: document.getElementById("btn-agent-resume"),
  btnAgentRecap: document.getElementById("btn-agent-recap"),
  btnAgentDismiss: document.getElementById("btn-agent-dismiss"),

  // Modals
  modalYt: document.getElementById("modal-youtube"),
  inputYtUrl: document.getElementById("yt-url-input"),
  btnConfirmYt: document.getElementById("btn-yt-submit"),
  btnCancelYt: document.getElementById("btn-yt-cancel"),
  btnCloseYtModal: document.getElementById("btn-close-yt-modal"),

  modalRecap: document.getElementById("modal-recap"),
  recapItemsList: document.getElementById("recap-items-list"),
  btnRecapBack: document.getElementById("btn-recap-back"),
  btnCloseRecapModal: document.getElementById("btn-close-recap-modal"),

  toast: document.getElementById("app-toast")
};

// ---------------------------------------------------------------------------
// 3. Formatting & Toast Utilities
// ---------------------------------------------------------------------------

function formatSeconds(sec) {
  if (isNaN(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
}[c]));

let toastTimer = null;
function showToast(msg) {
  if (!el.toast) return;
  el.toast.textContent = msg;
  el.toast.classList.remove("toast-hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.toast.classList.add("toast-hidden");
  }, 2600);
}

// ---------------------------------------------------------------------------
// 4. Video Playback & Timestamp Management (Dynamic / Real-Time Only)
// ---------------------------------------------------------------------------

function syncVideoMetadata(title, curTime, durTime) {
  if (title) {
    state.videoTitle = title;
    el.streamTitleDisplay.textContent = title;
    el.lblVideoName.textContent = title;
    el.agentFocusTitle.textContent = title;
  }
  if (curTime) {
    state.currentTime = curTime;
    el.streamTimeDisplay.textContent = curTime;
    el.streamTimeDisplay.classList.remove("hidden");
    if (el.streamSep) el.streamSep.classList.remove("hidden");
    el.lblTimeCur.textContent = curTime;
    el.agentFocusTime.textContent = curTime;
  }
  if (durTime) {
    state.durationTime = durTime;
    el.lblTimeDur.textContent = durTime;
  }
}

// Editable Title & Timestamp in Topbar
el.streamTitleDisplay.addEventListener("blur", () => {
  const val = el.streamTitleDisplay.textContent.trim();
  if (val) syncVideoMetadata(val, null, null);
});

el.streamTimeDisplay.addEventListener("blur", () => {
  const val = el.streamTimeDisplay.textContent.trim();
  if (val) syncVideoMetadata(null, val, null);
});

// Play / Pause Toggle
function togglePlayPause() {
  if (state.ytPlayer && typeof state.ytPlayer.getPlayerState === "function") {
    const s = state.ytPlayer.getPlayerState();
    if (s === 1) { // playing
      state.ytPlayer.pauseVideo();
      state.isPlaying = false;
    } else {
      state.ytPlayer.playVideo();
      state.isPlaying = true;
    }
  } else if (el.nativeVideo.src) {
    if (el.nativeVideo.paused) {
      el.nativeVideo.play();
      state.isPlaying = true;
    } else {
      el.nativeVideo.pause();
      state.isPlaying = false;
    }
  } else {
    // Simulated stream play/pause
    state.isPlaying = !state.isPlaying;
  }
  el.playbackIcon.textContent = state.isPlaying ? "⏸" : "▶";
}

el.btnPlayPause.addEventListener("click", togglePlayPause);

// Native Video Events
el.nativeVideo.addEventListener("timeupdate", () => {
  const cur = formatSeconds(el.nativeVideo.currentTime);
  const dur = formatSeconds(el.nativeVideo.duration || 0);
  syncVideoMetadata(null, cur, dur);
});

el.nativeVideo.addEventListener("play", () => {
  state.isPlaying = true;
  el.playbackIcon.textContent = "⏸";
});

el.nativeVideo.addEventListener("pause", () => {
  state.isPlaying = false;
  el.playbackIcon.textContent = "▶";
});

// Load Local Video File
function handleFileSelect(file) {
  if (!file) return;
  state.videoUrl = "";
  const url = URL.createObjectURL(file);
  el.nativeVideo.src = url;
  el.nativeVideo.classList.remove("hidden");
  el.ytContainer.classList.add("hidden");
  el.ambientPlaceholder.classList.add("hidden");

  const cleanName = file.name.replace(/\.[^/.]+$/, "");
  syncVideoMetadata(cleanName, "00:00", "00:00");
  el.nativeVideo.play().catch(() => {});
  showToast(`Loaded: ${cleanName}`);
}

el.btnOpenFile.addEventListener("click", () => el.filePicker.click());
el.btnPlaceholderFile.addEventListener("click", () => el.filePicker.click());
el.filePicker.addEventListener("change", e => {
  const file = e.target.files?.[0];
  if (file) handleFileSelect(file);
});

// Load YouTube Video
function extractYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function loadYouTubeVideo(url) {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    showToast("Invalid YouTube URL. Please check and retry.");
    return;
  }

  state.videoUrl = url;
  el.nativeVideo.pause();
  el.nativeVideo.classList.add("hidden");
  el.ambientPlaceholder.classList.add("hidden");
  el.ytContainer.classList.remove("hidden");

  // Direct robust responsive YouTube iframe embed
  el.ytContainer.innerHTML = `<iframe id="yt-player-frame" src="https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1" style="width:100%;height:100%;border:none;" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;

  state.isPlaying = true;
  el.playbackIcon.textContent = "⏸";

  let ytSec = 0;
  clearInterval(state.ytTimer);
  state.ytTimer = setInterval(() => {
    if (state.isPlaying) {
      ytSec += 1;
      syncVideoMetadata(null, formatSeconds(ytSec), null);
    }
  }, 1000);

  syncVideoMetadata("YouTube Stream", "00:00", null);

  // Proactively fetch YouTube oEmbed title for immediate UI reflection
  fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
    .then(r => r.json())
    .then(meta => {
      if (meta && meta.title) {
        syncVideoMetadata(meta.title, null, null);
      }
    })
    .catch(() => {});

  el.modalYt.classList.add("hidden");
  showToast("YouTube video connected successfully.");
}

el.btnOpenYt?.addEventListener("click", () => el.modalYt.classList.remove("hidden"));
el.btnPlaceholderYt?.addEventListener("click", () => el.modalYt.classList.remove("hidden"));
el.btnCloseYtModal?.addEventListener("click", () => el.modalYt.classList.add("hidden"));
el.btnCancelYt?.addEventListener("click", () => el.modalYt.classList.add("hidden"));
el.btnConfirmYt?.addEventListener("click", () => {
  const val = el.inputYtUrl.value.trim();
  if (val) loadYouTubeVideo(val);
});

// ---------------------------------------------------------------------------
// 5. Lucevia AI Agent Overlay (Sliding Side Panel)
// ---------------------------------------------------------------------------

function openLuceviaAgent(promptQuery = "") {
  // Pause video automatically on invocation
  if (state.isPlaying) {
    togglePlayPause();
  }

  state.isAgentOpen = true;
  el.agentPanel.classList.remove("hidden");
  el.agentFocusTime.textContent = state.currentTime || "Active Scene";
  el.agentFocusTitle.textContent = state.videoTitle;

  const queryToUse = promptQuery || el.agentCustomQuery.value.trim() || `Explain what is happening in this video${state.currentTime ? ` at ${state.currentTime}` : ""}`;
  el.agentCustomQuery.value = promptQuery || el.agentCustomQuery.value;

  fetchGeminiAnswer(queryToUse);
}

function closeLuceviaAgent() {
  state.isAgentOpen = false;
  el.agentPanel.classList.add("hidden");
}

el.btnTriggerAgent?.addEventListener("click", () => openLuceviaAgent());
el.btnBottomAsk?.addEventListener("click", () => openLuceviaAgent());
el.btnCloseAgent?.addEventListener("click", closeLuceviaAgent);
el.btnAgentDismiss?.addEventListener("click", closeLuceviaAgent);
el.btnAgentResume?.addEventListener("click", () => {
  closeLuceviaAgent();
  if (!state.isPlaying) togglePlayPause();
});

// Query Form Submission
el.agentQueryForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = el.agentCustomQuery.value.trim();
  if (q) fetchGeminiAnswer(q);
});

// Suggestion Chips
el.suggestionChips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip-item");
  if (!chip) return;
  const prompt = chip.getAttribute("data-prompt");
  if (prompt) {
    el.agentCustomQuery.value = prompt;
    fetchGeminiAnswer(prompt);
  }
});

// Mode Tabs (Explain simply / Show visually / Check understanding)
function switchMode(newMode) {
  state.activeMode = newMode;
  [el.tabExplain, el.tabVisual, el.tabQuiz].forEach(tab => {
    const isCurrent = tab.getAttribute("data-mode") === newMode;
    tab.classList.toggle("active", isCurrent);
    tab.setAttribute("aria-selected", isCurrent ? "true" : "false");
  });

  if (state.geminiData) {
    renderAgentContent();
  } else {
    fetchGeminiAnswer();
  }
}

el.tabExplain.addEventListener("click", () => switchMode("explain"));
el.tabVisual.addEventListener("click", () => switchMode("visual"));
el.tabQuiz.addEventListener("click", () => switchMode("quiz"));

// ---------------------------------------------------------------------------
// 6. Gemini LLM API Real-Time Inference (Multimodal Vision & Deep Context)
// ---------------------------------------------------------------------------

function captureVideoFrame() {
  if (!el.nativeVideo || el.nativeVideo.readyState < 2 || !el.nativeVideo.videoWidth) {
    return null;
  }
  try {
    const canvas = document.createElement("canvas");
    const maxDim = 640;
    let w = el.nativeVideo.videoWidth;
    let h = el.nativeVideo.videoHeight;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(el.nativeVideo, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.7);
  } catch (err) {
    console.warn("[Lucevia] Video frame capture fallback:", err);
    return null;
  }
}

async function fetchGeminiAnswer(query = "") {
  state.isLoading = true;
  state.quizAnswer = null;
  state.quizOutcome = null;
  state.currentQuery = query || el.agentCustomQuery.value.trim() || `Explain what is happening in this video${state.currentTime ? ` at ${state.currentTime}` : ""}`;
  renderLoading();

  try {
    const frameImage = captureVideoFrame();

    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoTitle: state.videoTitle,
        videoUrl: state.videoUrl || "",
        streamingPlatform: state.streamingPlatform,
        currentTime: state.currentTime || "Current Moment",
        userQuery: state.currentQuery,
        mode: state.activeMode,
        frameImage: frameImage
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to receive answer from Gemini AI.");
    }

    state.geminiData = data;

    // Track in session recap
    const recapKey = `${data.topic} ${state.currentTime ? `(${state.currentTime})` : ""}`.trim();
    if (!state.recapHistory.find(item => item.key === recapKey)) {
      state.recapHistory.push({
        key: recapKey,
        topic: data.topic,
        time: state.currentTime || "Active Scene",
        summary: data.summary,
        video: state.videoTitle
      });
    }

    renderAgentContent();
  } catch (err) {
    renderError(err.message);
  } finally {
    state.isLoading = false;
  }
}

// ---------------------------------------------------------------------------
// 7. Dynamic View Renderers (Explain / Visual / Quiz / Loading / Error)
// ---------------------------------------------------------------------------

function renderLoading() {
  el.contentArea.innerHTML = `
    <div class="loading-box">
      <img src="/assets/lucevia-star.png" class="loading-star-img" alt="✦" />
      <div class="loading-title">Consulting Google Gemini AI...</div>
      <div class="loading-sub">Analyzing "${esc(state.videoTitle)}"${state.currentTime ? ` at ${esc(state.currentTime)}` : ""}</div>
    </div>
  `;
}

function renderError(msg) {
  el.contentArea.innerHTML = `
    <div class="content-result-card">
      <div class="content-topic-header">
        <img src="/assets/lucevia-star.png" class="tag-star-emblem" alt="✦" />
        <span class="content-topic-badge" style="color:var(--status-bad)">INFERENCE NOTICE</span>
      </div>
      <div class="content-topic-title" style="color:#ffb6a8">Could Not Connect to Gemini</div>
      <p class="content-paragraph">${esc(msg)}</p>
      <button class="footer-btn primary" id="btn-retry-query" style="margin-top:14px;">Retry Query ↻</button>
    </div>
  `;
  document.getElementById("btn-retry-query")?.addEventListener("click", () => fetchGeminiAnswer(state.currentQuery));
}

function renderAgentContent() {
  const data = state.geminiData;
  if (!data) return;

  if (state.activeMode === "explain") {
    renderExplainMode(data);
  } else if (state.activeMode === "visual") {
    renderVisualMode(data);
  } else if (state.activeMode === "quiz") {
    renderQuizMode(data);
  }
}

// 1. Explain Simply Mode
function renderExplainMode(data) {
  const summaryParagraphs = (data.summary || "")
    .split("\n\n")
    .filter(p => p.trim())
    .map(p => `<p class="content-paragraph">${esc(p.trim())}</p>`)
    .join("");

  const keyPointsHTML = (data.keyPoints || [])
    .map(pt => `<li><img src="/assets/lucevia-star.png" class="bullet-star-img" alt="✦" /><span>${esc(pt)}</span></li>`)
    .join("");

  el.contentArea.innerHTML = `
    <div class="content-result-card">
      <div class="content-topic-header">
        <img src="/assets/lucevia-star.png" class="tag-star-emblem" alt="✦" />
        <span class="content-topic-badge">SUBSTANTIVE COMPREHENSION</span>
      </div>
      <h2 class="content-topic-title">${esc(data.topic)}</h2>

      <div class="content-body">
        ${summaryParagraphs}
      </div>

      ${data.analogy ? `
        <div class="analogy-box">
          <div class="analogy-eyebrow">Relatable Analogy</div>
          <div class="analogy-text">"${esc(data.analogy)}"</div>
        </div>
      ` : ""}

      ${data.keyPoints && data.keyPoints.length ? `
        <div class="takeaways-section">
          <div class="takeaways-heading">Key Domain Takeaways</div>
          <ul class="takeaways-list">
            ${keyPointsHTML}
          </ul>
        </div>
      ` : ""}

      <div style="font-size:12px;color:var(--text-dim);margin-top:24px;display:flex;align-items:center;gap:8px;">
        <img src="/assets/lucevia-star.png" style="height:12px;width:auto;" alt="✦" />
        Generated in real time via ${esc(data.model || "Google Gemini Live AI")}
      </div>
    </div>
  `;
}

// 2. Show Visually Mode
function renderVisualMode(data) {
  const diagram = data.diagram || { title: "Conceptual Flow", steps: [] };
  const stepsHTML = (diagram.steps || []).map((step, idx) => `
    <div class="diagram-step-card ${step.highlight ? "active-phase" : ""}">
      <div>
        <div style="font-size:11px;font-weight:800;color:var(--gold);margin-bottom:2px;">PHASE 0${idx + 1}</div>
        <div class="step-label">${esc(step.label)}</div>
      </div>
      <div class="step-desc">${esc(step.description)}</div>
    </div>
  `).join("");

  el.contentArea.innerHTML = `
    <div class="content-result-card">
      <div class="content-topic-header">
        <img src="/assets/lucevia-star.png" class="tag-star-emblem" alt="✦" />
        <span class="content-topic-badge">VISUAL STRUCTURE</span>
      </div>
      <h2 class="content-topic-title">${esc(diagram.title || data.topic)}</h2>
      <p class="content-paragraph">${esc(data.summary ? data.summary.split("\n")[0] : "")}</p>

      <div class="diagram-flow-container">
        ${stepsHTML}
      </div>

      <div style="font-size:12px;color:var(--text-dim);margin-top:24px;display:flex;align-items:center;gap:8px;">
        <img src="/assets/lucevia-star.png" style="height:12px;width:auto;" alt="✦" />
        Visualized in real time via ${esc(data.model || "Google Gemini Live AI")}
      </div>
    </div>
  `;
}

// 3. Check Understanding (Quiz) Mode
function renderQuizMode(data) {
  const quiz = data.quiz;
  if (!quiz || !quiz.question) {
    el.contentArea.innerHTML = `
      <div class="content-result-card">
        <p class="content-paragraph">No interactive quiz available for this moment. Select "Explain simply" to review the concept.</p>
      </div>
    `;
    return;
  }

  const choicesHTML = (quiz.choices || []).map((choice, idx) => {
    const letters = ["A", "B", "C", "D"];
    let stateClass = "";
    if (state.quizAnswer !== null) {
      if (idx === quiz.correctIndex) stateClass = "correct";
      else if (idx === state.quizAnswer) stateClass = "wrong";
    }

    return `
      <button class="quiz-choice-btn ${stateClass}" data-choice="${idx}" ${state.quizAnswer !== null ? "disabled" : ""}>
        <span class="choice-letter">${letters[idx] || (idx + 1)}</span>
        <span>${esc(choice)}</span>
      </button>
    `;
  }).join("");

  el.contentArea.innerHTML = `
    <div class="content-result-card">
      <div class="content-topic-header">
        <img src="/assets/lucevia-star.png" class="tag-star-emblem" alt="✦" />
        <span class="content-topic-badge">COMPREHENSION CHECK</span>
      </div>
      <h2 class="content-topic-title">${esc(data.topic)}</h2>

      <div class="quiz-container">
        <div class="quiz-question">${esc(quiz.question)}</div>
        <div class="quiz-options" id="quiz-options-group">
          ${choicesHTML}
        </div>

        ${state.quizAnswer !== null ? `
          <div class="quiz-rationale-box">
            <div class="rationale-title">
              ${state.quizOutcome === "correct" ? "✓ Correct!" : "✗ Explanation"}
            </div>
            <div class="rationale-text">${esc(quiz.rationale)}</div>
            <button class="footer-btn ghost" id="btn-quiz-retry" style="margin-top:10px;padding:6px 12px;font-size:12px;">Try Again ↻</button>
          </div>
        ` : ""}
      </div>
    </div>
  `;

  // Attach Quiz choice click listeners
  document.querySelectorAll(".quiz-choice-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-choice"));
      state.quizAnswer = idx;
      state.quizOutcome = (idx === quiz.correctIndex) ? "correct" : "wrong";
      renderQuizMode(data);
    });
  });

  document.getElementById("btn-quiz-retry")?.addEventListener("click", () => {
    state.quizAnswer = null;
    state.quizOutcome = null;
    renderQuizMode(data);
  });
}

// ---------------------------------------------------------------------------
// 8. Session Recap Modal
// ---------------------------------------------------------------------------

function openRecapModal() {
  el.recapItemsList.innerHTML = state.recapHistory.length === 0
    ? `<p class="modal-description" style="padding:18px 0;text-align:center;">No concepts explored yet in this session. Ask Lucevia AI at any moment to begin!</p>`
    : state.recapHistory.map(item => `
        <div class="recap-item-card">
          <div class="recap-item-topic">
            <img src="/assets/lucevia-star.png" class="inline-star-emblem" alt="✦" />
            ${esc(item.topic)} ${item.time && item.time !== "Active Scene" ? `<span style="font-size:12px;color:var(--text-dim);font-weight:400;">(${esc(item.time)})</span>` : ""}
          </div>
          <div class="recap-item-summary">${esc(item.summary ? item.summary.slice(0, 180) + "..." : "")}</div>
        </div>
      `).join("");

  el.modalRecap.classList.remove("hidden");
}

el.btnAgentRecap?.addEventListener("click", openRecapModal);
el.btnCloseRecapModal?.addEventListener("click", () => el.modalRecap.classList.add("hidden"));
el.btnRecapBack?.addEventListener("click", () => el.modalRecap.classList.add("hidden"));

// ---------------------------------------------------------------------------
// 9. Global Keyboard & Remote Control Shortcuts
// ---------------------------------------------------------------------------

window.addEventListener("keydown", (e) => {
  // If typing inside an input field, do not hijack hotkeys
  if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
    if (e.key === "Escape") {
      document.activeElement.blur();
    }
    return;
  }

  // [H] or [Enter] invokes the Lucevia Agent
  if (e.key === "h" || e.key === "H") {
    e.preventDefault();
    if (state.isAgentOpen) closeLuceviaAgent();
    else openLuceviaAgent();
    return;
  }

  // [Escape] dismisses open panel or modals
  if (e.key === "Escape") {
    if (!el.modalYt.classList.contains("hidden")) {
      el.modalYt.classList.add("hidden");
    } else if (!el.modalRecap.classList.contains("hidden")) {
      el.modalRecap.classList.add("hidden");
    } else if (state.isAgentOpen) {
      closeLuceviaAgent();
    }
    return;
  }

  // [Space] toggles Play/Pause
  if (e.key === " " || e.code === "Space") {
    e.preventDefault();
    togglePlayPause();
    return;
  }
});

// ---------------------------------------------------------------------------
// 10. Fire OS & Vega OS System IPC Event Bridge
// ---------------------------------------------------------------------------

window.addEventListener("message", (event) => {
  if (!event.data || typeof event.data !== "object") return;

  // Fire OS / Vega OS MediaSession Sync
  if (event.data.type === "LUCEVIA_SYNC_MEDIA" && event.data.data) {
    const { title, currentTime } = event.data.data;
    syncVideoMetadata(title, currentTime, null);
  }

  // Fire TV Remote / System Overlay Trigger
  if (event.data.type === "LUCEVIA_TRIGGER") {
    if (!state.isAgentOpen) openLuceviaAgent();
  }
});
