const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true
    },
    name: {
      type: String,
      required: [true, "Food name is required"],
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0
    },
    image: {
      type: String,
      required: [true, "Image URL is required"]
    },
    category: {
      type: String,
      required: [true, "Category is required"]
    },
    isVeg: {
      type: Boolean,
      default: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodItem", foodItemSchema);
