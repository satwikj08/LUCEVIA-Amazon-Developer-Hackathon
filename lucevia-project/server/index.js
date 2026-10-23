/**
 * Lucevia — Fire TV & Vega OS Live AI Agent Backend
 * Real-time video comprehension powered strictly by Google Gemini API.
 */

import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "../public");
const ENV_PATH = path.resolve(__dirname, "../.env");
const PORT = Number(process.env.PORT || 4173);
const HOST = "127.0.0.1";

let activeApiKey = process.env.GEMINI_API_KEY || "";
let activeModel = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

// ---------------------------------------------------------------------------
// Real-Time Gemini AI Inference Engine
// ---------------------------------------------------------------------------

async function queryGeminiAgent({
  videoTitle,
  videoUrl,
  streamingPlatform,
  currentTime,
  transcriptSnippet,
  userQuery,
  mode,
  frameImage
}) {
  if (!activeApiKey) {
    throw new Error("GEMINI_API_KEY_REQUIRED");
  }

  // 1. YouTube Deep Grounding: If a YouTube URL is provided, fetch oEmbed metadata and thumbnail image
  let ytMetadata = null;
  let ytThumbnailBase64 = null;
  if (videoUrl && (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be"))) {
    try {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
      const oEmbedRes = await fetch(oEmbedUrl, { signal: AbortSignal.timeout(6000) });
      if (oEmbedRes.ok) {
        ytMetadata = await oEmbedRes.json();
        if (ytMetadata.title && (!videoTitle || videoTitle === "Live Video Stream" || videoTitle === "YouTube Stream")) {
          videoTitle = ytMetadata.title;
        }
        if (ytMetadata.thumbnail_url) {
          const thumbRes = await fetch(ytMetadata.thumbnail_url, { signal: AbortSignal.timeout(6000) });
          if (thumbRes.ok) {
            const thumbBuf = await thumbRes.arrayBuffer();
            ytThumbnailBase64 = Buffer.from(thumbBuf).toString("base64");
          }
        }
      }
    } catch (ytErr) {
      console.warn("[Lucevia AI] YouTube metadata fetch note:", ytErr.message);
    }
  }

  // 2. Prepare multimodal image part if frame image or YouTube thumbnail is available
  let imagePart = null;
  if (frameImage && typeof frameImage === "string") {
    const match = frameImage.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (match) {
      imagePart = {
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      };
    } else if (frameImage.length > 50) {
      imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: frameImage
        }
      };
    }
  } else if (ytThumbnailBase64) {
    imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: ytThumbnailBase64
      }
    };
  }

  // 3. Assemble Gemini Prompt and Multimodal Contents
  const systemInstruction = `You are Lucevia, a luxury TV-native comprehension companion for Fire OS and Vega OS running as an intelligent ambient overlay.
The viewer is watching video content:
- Video Title: "${videoTitle || "Active Video Stream"}"
${videoUrl ? `- Video URL: ${videoUrl}\n` : ""}${ytMetadata ? `- Channel / Author: "${ytMetadata.author_name || "Unknown"}"\n- Verified Video Title: "${ytMetadata.title}"\n` : ""}- Playback Timestamp: ${currentTime || "Current Moment"}
${transcriptSnippet ? `- Scene Details / Notes: "${transcriptSnippet}"\n` : ""}- Viewer's Inquiry: "${userQuery || "Explain what is happening in this video at this timestamp"}"
- Requested Mode: "${mode || "explain"}"

CRITICAL COMPREHENSION DIRECTIVES:
1. REAL CONTEXT GROUNDING:
   ${imagePart ? "- An image of the video screen / frame captured at this moment has been provided. CAREFULLY EXAMINE the visual picture (identify the setting, people, objects, equations/formulas, text, diagrams, slides, on-screen action, or educational/entertainment topic depicted)." : ""}
   ${videoUrl ? "- The exact video URL and metadata are provided above. Ground your answer completely in the real subject matter of this specific video." : ""}
   - You MUST explain the actual topic, subject matter, concepts, or narrative taking place in this specific video.
   - DO NOT explain the algorithm or internal feature mechanisms of the Lucevia application itself! The viewer is asking about the VIDEO content, NOT how Lucevia works.
   - Whether this video is an educational lecture, science documentary, sports game, political debate, news broadcast, legal trial, programming tutorial, spiritual discourse, movie scene, or kids show: deliver substantive domain insights directly addressing the topic in the video.
2. If the viewer asks ANY specific or random question (e.g. "What does this mean?", "Explain this formula", "Why did this happen?", "What is shown on screen?"), answer that exact question thoroughly and directly.
3. Keep the tone sophisticated, accessible, crystal-clear, and formatted for high legibility on a television screen.

Return STRICT JSON matching this exact structure:
{
  "topic": "Precise name of the subject matter, concept, or scene in the video",
  "mode": "${mode || "explain"}",
  "summary": "Crisp, thorough explanation breaking down the subject matter of the video (2-3 well-structured paragraphs).",
  "analogy": "A memorable, intuitive real-world analogy that makes this concept immediately clear.",
  "keyPoints": [
    "Key domain takeaway 1",
    "Key domain takeaway 2",
    "Key domain takeaway 3"
  ],
  "diagram": {
    "title": "Visual Conceptual Flow / Mental Model",
    "steps": [
      { "label": "Phase / Element 1", "description": "Specific substantive point", "highlight": false },
      { "label": "Phase / Element 2", "description": "Core active focus", "highlight": true },
      { "label": "Phase / Element 3", "description": "Progression / Outcome", "highlight": false },
      { "label": "Phase / Element 4", "description": "Practical significance / conclusion", "highlight": false }
    ]
  },
  "quiz": {
    "question": "A sharp, engaging multiple-choice question testing understanding of this specific video topic",
    "choices": [
      "Correct answer choice",
      "Plausible but incorrect option B",
      "Plausible but incorrect option C"
    ],
    "correctIndex": 0,
    "rationale": "Clear explanation of why the correct answer is accurate."
  }
}
Respond with ONLY the JSON object. Do not wrap in markdown or backticks.`;

  const contents = [];
  if (imagePart) {
    contents.push(imagePart);
  }
  contents.push(systemInstruction);

  const ai = new GoogleGenAI({ apiKey: activeApiKey });
  const modelsToTry = [activeModel, "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: "application/json"
        }
      });

      const rawText = response?.text?.trim() || "";
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (ytMetadata && ytMetadata.title && (!parsed.topic || parsed.topic === "Active Video Stream")) {
          parsed.topic = ytMetadata.title;
        }
        return parsed;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Lucevia AI] Model ${model} retry note:`, err.message?.slice(0, 80));
    }
  }

  throw lastError || new Error("Failed to receive response from Gemini model.");
}

// ---------------------------------------------------------------------------
// HTTP Helpers & Static Serving
// ---------------------------------------------------------------------------

function jsonReply(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

const MIMES = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".woff2": "font/woff2"
};

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  // 1. Health Probe
  if (req.method === "GET" && pathname === "/health") {
    return jsonReply(res, 200, {
      ok: true,
      service: "lucevia-agent-overlay",
      model: activeModel,
      hasGeminiKey: Boolean(activeApiKey)
    });
  }

  // 2. Set / Update Gemini API Key
  if (req.method === "POST" && pathname === "/api/key") {
    let raw = "";
    req.on("data", chunk => { raw += chunk; });
    req.on("end", async () => {
      try {
        const body = JSON.parse(raw);
        if (typeof body.apiKey === "string" && body.apiKey.trim()) {
          activeApiKey = body.apiKey.trim();
          if (body.model) activeModel = body.model.trim();

          // Persist to .env
          try {
            await fs.writeFile(ENV_PATH, `GEMINI_API_KEY=${activeApiKey}\nGEMINI_MODEL=${activeModel}\nPORT=${PORT}\n`, "utf8");
          } catch (writeErr) {
            console.warn("Could not persist key to .env file:", writeErr.message);
          }

          return jsonReply(res, 200, {
            ok: true,
            message: "Gemini API Key successfully updated in Lucevia backend",
            model: activeModel
          });
        }
        return jsonReply(res, 400, { error: "Missing or invalid apiKey" });
      } catch {
        return jsonReply(res, 400, { error: "Invalid JSON payload" });
      }
    });
    return;
  }

  // 3. Real-Time Gemini AI Video Comprehension Endpoint
  if (req.method === "POST" && pathname === "/api/explain") {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 5242880) req.destroy(); // 5MB limit for base64 video frame captures
    });

    req.on("end", async () => {
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return jsonReply(res, 400, { error: "Malformed JSON payload" });
      }

      // Check if client provided apiKey dynamically
      if (body.apiKey && typeof body.apiKey === "string") {
        activeApiKey = body.apiKey.trim();
      }

      if (!activeApiKey) {
        return jsonReply(res, 401, {
          error: "GEMINI_API_KEY_REQUIRED",
          message: "Please configure your Gemini API Key in .env or via the TV interface to use the live AI comprehension agent."
        });
      }

      try {
        const aiResponse = await queryGeminiAgent({
          videoTitle: body.videoTitle || "Active Video Stream",
          videoUrl: body.videoUrl || "",
          streamingPlatform: body.streamingPlatform || "Fire TV Stream",
          currentTime: body.currentTime || "00:00",
          transcriptSnippet: body.transcriptSnippet || body.momentText || "",
          userQuery: body.userQuery || body.query || "",
          mode: body.mode || "explain",
          frameImage: body.frameImage || body.imageData || null
        });

        return jsonReply(res, 200, {
          ok: true,
          ...aiResponse,
          source: "gemini-live-model",
          model: activeModel
        });
      } catch (err) {
        console.error("[Lucevia Gemini Agent Error]:", err.message);
        if (err.message === "GEMINI_API_KEY_REQUIRED") {
          return jsonReply(res, 401, {
            error: "GEMINI_API_KEY_REQUIRED",
            message: "A Gemini API Key is required to analyze this video."
          });
        }
        return jsonReply(res, 500, {
          error: "GEMINI_INFERENCE_ERROR",
          message: err.message
        });
      }
    });
    return;
  }

  // 4. Static TV Overlay UI Assets
  if (req.method === "GET" || req.method === "HEAD") {
    let filePath = path.join(PUBLIC_DIR, pathname === "/" ? "/index.html" : pathname);
    if (!filePath.startsWith(PUBLIC_DIR)) {
      return jsonReply(res, 403, { error: "Forbidden" });
    }

    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
      const data = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIMES[ext] || "application/octet-stream",
        "Content-Length": data.length,
        "Cache-Control": "no-cache"
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
    return;
  }

  res.writeHead(405, { "Content-Type": "text/plain" });
  res.end("Method Not Allowed");
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, HOST, () => {
    console.log(`\n✦ LUCEVIA FIRE TV AGENT BACKEND ONLINE`);
    console.log(`  Live URL:      http://${HOST}:${PORT}`);
    console.log(`  Gemini Engine: ${activeModel}`);
    console.log(`  API Key:       ${activeApiKey ? "Configured ✓" : "Awaiting Key"}\n`);
  });
}

export { server, queryGeminiAgent, activeApiKey };
