/**
 * Lucevia — Smoke Test Suite
 * Real-Time Gemini AI TV Agent Overlay
 * Run: npm test
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { server } from "../server/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// HTTP Server & Agent API Endpoints
// ---------------------------------------------------------------------------

test("live HTTP server handles health, api-key update, and static assets", async () => {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Health check probe
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.equal(healthRes.status, 200);
    const healthJson = await healthRes.json();
    assert.equal(healthJson.ok, true);
    assert.equal(healthJson.service, "lucevia-agent-overlay");

    // 2. Explain API returns 401 if GEMINI_API_KEY is not configured (or 200 with structured JSON if key is configured)
    const explainRes = await fetch(`${baseUrl}/api/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoTitle: "Introduction to Quantum Mechanics: Wave-Particle Duality",
        currentTime: "01:20",
        userQuery: "Explain the double-slit experiment simply",
        mode: "explain"
      })
    });
    
    // Status is 401 (Awaiting key) or 200 (if key is already in env)
    assert.ok(explainRes.status === 401 || explainRes.status === 200);
    const explainJson = await explainRes.json();
    if (explainRes.status === 401) {
      assert.equal(explainJson.error, "GEMINI_API_KEY_REQUIRED");
    }

    // 3. Key update endpoint handles malformed inputs correctly
    const badKeyRes = await fetch(`${baseUrl}/api/key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    assert.equal(badKeyRes.status, 400);

    // 4. Static HTML UI serves with luxury title
    const indexRes = await fetch(`${baseUrl}/`);
    assert.equal(indexRes.status, 200);
    const htmlText = await indexRes.text();
    assert.ok(htmlText.includes("Lucevia"));
    assert.ok(htmlText.includes("Ask Lucevia AI"));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test("Gemini AI agent deeply understands YouTube video context via URL", async () => {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const explainRes = await fetch(`${baseUrl}/api/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoUrl: "https://www.youtube.com/watch?v=aircAruvnKk", // 3Blue1Brown Neural Networks
        videoTitle: "YouTube Stream",
        currentTime: "02:15",
        userQuery: "What is this video explaining?",
        mode: "explain"
      })
    });

    assert.equal(explainRes.status, 200);
    const data = await explainRes.json();
    assert.equal(data.ok, true);
    assert.ok(data.topic, "Should return a topic");
    assert.ok(data.summary, "Should return a summary");
    // Verify it answers in context of neural networks / deep learning, NOT application algorithms
    const fullText = (data.topic + " " + data.summary + " " + JSON.stringify(data.keyPoints)).toLowerCase();
    const hasNetworkContext = fullText.includes("neural") || fullText.includes("network") || fullText.includes("learning") || fullText.includes("digit");
    assert.ok(hasNetworkContext, `Expected video context to mention neural networks, got: ${data.topic}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test("Gemini AI agent visually scans and understands uploaded video frame image", async () => {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const imgBuf = await fs.readFile(path.resolve(__dirname, "../public/assets/lucevia-star.png"));
    const base64Img = `data:image/png;base64,${imgBuf.toString("base64")}`;

    const explainRes = await fetch(`${baseUrl}/api/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoTitle: "Celestial Geometry and Astronomical Navigation",
        currentTime: "03:45",
        userQuery: "Explain what is shown on screen in this video frame",
        mode: "explain",
        frameImage: base64Img
      })
    });

    assert.equal(explainRes.status, 200);
    const data = await explainRes.json();
    assert.equal(data.ok, true);
    assert.ok(data.topic, "Should return a topic");
    assert.ok(data.summary, "Should return a summary");
    assert.ok(Array.isArray(data.keyPoints) && data.keyPoints.length > 0, "Should have key points");
    assert.ok(data.diagram && Array.isArray(data.diagram.steps), "Should have visual flow diagram steps");
    assert.ok(data.quiz && Array.isArray(data.quiz.choices), "Should have quiz");
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
