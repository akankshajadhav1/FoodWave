const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true
    },
    image: {
      type: String,
      required: [true, "Image URL is required"]
    },
    cuisines: [
      {
        type: String,
        required: true
      }
    ],
    rating: {
      type: Number,
      default: 4.2,
      min: 0,
      max: 5
    },
    deliveryTime: {
      type: String,
      default: "30-40 min"
    },
    costForTwo: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
