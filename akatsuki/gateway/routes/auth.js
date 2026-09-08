const express = require("express");
const passport = require("passport");
const User = require("../models/User");

const router = express.Router();

// POST /api/auth/signup { username, password, role?, preferredLanguage?, region? }
router.post("/signup", async (req, res) => {
  const { username, password, role, preferredLanguage, region } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }
  try {
    const user = new User({ username, role, preferredLanguage, region });
    // .register() is provided by passport-local-mongoose — hashes+salts the password
    await User.register(user, password);
    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: "registered but auto-login failed" });
      res.json({ user: { id: user.id, username: user.username, role: user.role } });
    });
  } catch (err) {
    res.status(400).json({ error: err.message }); // e.g. "User already exists"
  }
});

// POST /api/auth/login { username, password }
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ user: { id: req.user.id, username: req.user.username, role: req.user.role } });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "logout failed" });
    res.json({ ok: true });
  });
});

// GET /api/auth/me — check current session
router.get("/me", (req, res) => {
  if (!req.isAuthenticated()) return res.json({ user: null });
  res.json({ user: { id: req.user.id, username: req.user.username, role: req.user.role } });
});

module.exports = router;
