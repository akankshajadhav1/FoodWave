const mongoose = require("mongoose");
const dns = require("dns");

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/food-delivery";
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of hanging
    });
    console.log("MongoDB Connected Successfully!");
  } catch (error) {
    console.error("MongoDB Atlas Connection Error:", error.message);
    // Fallback attempt to local mongodb if cloud string fails
    try {
      console.log("Attempting fallback to local MongoDB...");
      await mongoose.connect("mongodb://127.0.0.1:27017/food-delivery", {
        serverSelectionTimeoutMS: 5000
      });
      console.log("Local MongoDB Connected Successfully!");
    } catch (fallbackError) {
      console.error("Local MongoDB Fallback Failed:", fallbackError.message);
      console.log("Server will continue running in memory / API mode.");
    }
  }
};

module.exports = connectDB;