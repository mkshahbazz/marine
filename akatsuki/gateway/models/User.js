const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

// "Stakeholder Profiles" from the diagram — passport-local-mongoose adds
// `username`, a salted+hashed `password` field, and .register()/.authenticate()
// statics automatically, so we only declare the extra profile fields ourselves.
const UserSchema = new mongoose.Schema({
  role: { type: String, enum: ["fisherman", "researcher", "admin", "other"], default: "fisherman" },
  preferredLanguage: { type: String, default: "en" }, // ISO-639 code, see gateway/services/bhashini.js
  region: { type: String, default: "" }, // e.g. "Chennai coast" — free text, not geocoded
  createdAt: { type: Date, default: Date.now },
});

UserSchema.plugin(passportLocalMongoose); // adds username/password/authenticate/register

module.exports = mongoose.model("User", UserSchema);
