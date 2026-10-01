const express = require("express");
const {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
} = require("../controllers/restaurantController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getRestaurants);
router.get("/:id", getRestaurantById);
router.post("/", protect, adminOnly, createRestaurant);
router.put("/:id", protect, adminOnly, updateRestaurant);
router.delete("/:id", protect, adminOnly, deleteRestaurant);

module.exports = router;
