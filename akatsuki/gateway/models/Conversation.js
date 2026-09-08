const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  language: { type: String, default: "en" },
  intent: { type: String, default: null }, // hazard_check / pfz_search / general_advisory
  createdAt: { type: Date, default: Date.now },
});

const ConversationSchema = new mongoose.Schema({
  // null for anonymous/guest chats — auth is optional, see routes/chat.js
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  messages: [MessageSchema],
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Conversation", ConversationSchema);
