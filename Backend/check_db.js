const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");
const Restaurant = require("./models/Restaurant");
const FoodItem = require("./models/FoodItem");
const Category = require("./models/Category");
const Order = require("./models/Order");

const checkDB = async () => {
  try {
    console.log("Connecting to MONGODB_URL:", process.env.MONGODB_URL);
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ Successfully connected to MongoDB Atlas!");

    const dbName = mongoose.connection.name;
    console.log(`📌 Connected Database Name: "${dbName}"`);

    const usersCount = await User.countDocuments();
    const restaurantsCount = await Restaurant.countDocuments();
    const foodsCount = await FoodItem.countDocuments();
    const categoriesCount = await Category.countDocuments();
    const ordersCount = await Order.countDocuments();

    console.log("\n📊 Current Database Record Counts:");
    console.log(`- Users: ${usersCount}`);
    console.log(`- Restaurants: ${restaurantsCount}`);
    console.log(`- Food Items: ${foodsCount}`);
    console.log(`- Categories: ${categoriesCount}`);
    console.log(`- Orders: ${ordersCount}`);

    const users = await User.find({}).select("-password");
    console.log("\n👤 Saved Users in Database:");
    console.log(users);

    process.exit(0);
  } catch (err) {
    console.error("❌ MongoDB Inspection Failed:", err.message);
    process.exit(1);
  }
};

checkDB();
