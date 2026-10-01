const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");

const testRegistration = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB Atlas.");

    // Fetch all existing users in the database
    const users = await User.find({}).sort({ createdAt: -1 });
    console.log(`\n📋 Found Total ${users.length} Users in MongoDB 'users' Collection:\n`);

    users.forEach((u, i) => {
      console.log(`${i + 1}. Name: "${u.name}" | Email: "${u.email}" | Role: "${u.role}" | ID: ${u._id}`);
    });

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

testRegistration();
