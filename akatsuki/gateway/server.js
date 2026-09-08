require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const { connectDB } = require("./config/db");
const passport = require("./config/passport");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",").map((o) => o.trim()).filter(Boolean);

app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  store: process.env.MONGODB_URI ? MongoStore.create({ mongoUrl: process.env.MONGODB_URI }) : undefined,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mongo_configured: Boolean(process.env.MONGODB_URI),
    agentic_platform_url: process.env.AGENTIC_PLATFORM_URL || "http://localhost:8000",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes); // exposes /api/chat, /api/chat/history, /api/languages

async function start() {
  await connectDB();
  app.listen(PORT, () => console.log(`Gateway listening on :${PORT}`));
}

start();
