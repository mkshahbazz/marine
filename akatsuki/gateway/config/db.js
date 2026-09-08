const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI not set — auth and conversation logging will be unavailable.");
    return;
  }
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}

module.exports = { connectDB };
