const express = require("express");
const axios = require("axios");
const bhashini = require("../services/bhashini");
const Conversation = require("../models/Conversation");

const router = express.Router();
const AGENTIC_PLATFORM_URL = process.env.AGENTIC_PLATFORM_URL || "http://localhost:8000";

router.get("/languages", (req, res) => {
  res.json(bhashini.SUPPORTED_LANGUAGES);
});

// POST /api/chat { message, language? }
// Auth is optional: logged-in users get their conversation tied to their
// profile; guests still get a full response, just not persisted per-user.
router.post("/chat", async (req, res) => {
  const { message } = req.body;
  const language = req.body.language || (req.user && req.user.preferredLanguage) || "en";

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    // 1. Translate to English at the gateway (matches the diagram: Bhashini
    //    sits next to the Backend Server, not inside the Python service).
    const messageEn = await bhashini.translate(message, language, "en");

    // 2. Forward the "Processed Request" to the Agentic Platform (Python/LangGraph).
    const { data } = await axios.post(
      `${AGENTIC_PLATFORM_URL}/api/chat`,
      { message: messageEn, language: "en" }, // Python service always gets English now
      { timeout: 30000 }
    );

    // 3. Translate the response back for the user.
    const responseTranslated = await bhashini.translate(data.response, "en", language);

    // 4. Log the conversation (per-user if authenticated, else anonymous doc).
    const userId = req.user ? req.user.id : null;
    try {
      await Conversation.create({
        user: userId,
        messages: [
          { role: "user", content: message, language },
          { role: "assistant", content: responseTranslated, language, intent: data.intent },
        ],
      });
    } catch (logErr) {
      console.error("Conversation logging failed (non-fatal):", logErr.message);
    }

    res.json({ ...data, response: responseTranslated });
  } catch (err) {
    console.error("Chat proxy error:", err.message);
    res.status(502).json({ error: "Agentic platform unreachable or errored", detail: err.message });
  }
});

// GET /api/chat/history — logged-in user's past conversations
router.get("/history", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "login required" });
  const conversations = await Conversation.find({ user: req.user.id }).sort({ updatedAt: -1 }).limit(20);
  res.json(conversations);
});

module.exports = router;
