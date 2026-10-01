const mongoose = require("mongoose");
require("dotenv").config();
const Category = require("./models/Category");
const Restaurant = require("./models/Restaurant");
const FoodItem = require("./models/FoodItem");
const User = require("./models/User");

const seedData = async () => {
  try {
    const connStr = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/food-delivery";
    await mongoose.connect(connStr);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing
    await Category.deleteMany({});
    await Restaurant.deleteMany({});
    await FoodItem.deleteMany({});

    // Seed Categories
    const categories = await Category.insertMany([
      { name: "Biryani", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500" },
      { name: "Pizza", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500" },
      { name: "Burger", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500" },
      { name: "North Indian", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500" },
      { name: "Chinese", image: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=500" },
      { name: "Desserts", image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500" }
    ]);

    // Seed Restaurants
    const restaurants = await Restaurant.insertMany([
      {
        name: "Spice Garden",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500",
        cuisines: ["North Indian", "Biryani"],
        rating: 4.5,
        deliveryTime: "25-30 min",
        costForTwo: 450,
        address: "MG Road, Downtown",
        isOpen: true
      },
      {
        name: "Italiano Pizza Hub",
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500",
        cuisines: ["Italian", "Pizza", "Fast Food"],
        rating: 4.3,
        deliveryTime: "30-35 min",
        costForTwo: 600,
        address: "Park Street, City Center",
        isOpen: true
      },
      {
        name: "Wok & Roll Chinese",
        image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500",
        cuisines: ["Chinese", "Asian"],
        rating: 4.2,
        deliveryTime: "20-25 min",
        costForTwo: 350,
        address: "Sector 14, Commercial Hub",
        isOpen: true
      }
    ]);

    // Seed Food Items
    await FoodItem.insertMany([
      {
        restaurant: restaurants[0]._id,
        name: "Hyderabadi Chicken Biryani",
        description: "Richly flavored aromatic rice with tender chicken piece cooked in dum style.",
        price: 280,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500",
        category: "Biryani",
        isVeg: false,
        isAvailable: true
      },
      {
        restaurant: restaurants[0]._id,
        name: "Paneer Butter Masala",
        description: "Cottage cheese cubes cooked in rich creamy tomato gravy.",
        price: 240,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500",
        category: "North Indian",
        isVeg: true,
        isAvailable: true
      },
      {
        restaurant: restaurants[1]._id,
        name: "Margherita Pizza",
        description: "Classic pizza topped with fresh mozzarella cheese, tomato sauce, and basil.",
        price: 320,
        image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500",
        category: "Pizza",
        isVeg: true,
        isAvailable: true
      },
      {
        restaurant: restaurants[2]._id,
        name: "Veg Hakka Noodles",
        description: "Wok-tossed noodles with crunchy fresh vegetables and savory soy sauce.",
        price: 180,
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500",
        category: "Chinese",
        isVeg: true,
        isAvailable: true
      }
    ]);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
};

seedData();
