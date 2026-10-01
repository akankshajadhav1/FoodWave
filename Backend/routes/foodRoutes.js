const express = require("express");
const {
  getFoods,
  getFoodsByRestaurant,
  createFood,
  updateFood,
  deleteFood
} = require("../controllers/foodController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getFoods);
router.get("/restaurant/:restaurantId", getFoodsByRestaurant);
router.post("/", protect, adminOnly, createFood);
router.put("/:id", protect, adminOnly, updateFood);
router.delete("/:id", protect, adminOnly, deleteFood);

module.exports = router;
