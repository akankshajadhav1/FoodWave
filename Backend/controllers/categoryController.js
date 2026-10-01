const Category = require("../models/Category");

// @desc    Get all categories
// @route   GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new category (Admin)
// @route   POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, image } = req.body;
    const category = new Category({ name, image });
    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCategories, createCategory };
