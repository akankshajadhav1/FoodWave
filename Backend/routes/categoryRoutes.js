const express = require("express");
const { getCategories, createCategory } = require("../controllers/categoryController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getCategories);
router.post("/", protect, adminOnly, createCategory);

module.exports = router;
