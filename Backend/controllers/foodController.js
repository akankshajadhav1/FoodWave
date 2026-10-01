const FoodItem = require("../models/FoodItem");

// @desc    Get all food items with search, category & veg filter
// @route   GET /api/foods
const getFoods = async (req, res) => {
  try {
    const { search, category, isVeg, restaurant } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (category) {
      query.category = { $regex: category, $options: "i" };
    }
    if (isVeg !== undefined) {
      query.isVeg = isVeg === "true";
    }
    if (restaurant) {
      query.restaurant = restaurant;
    }

    const foods = await FoodItem.find(query).populate("restaurant", "name address rating");
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get foods by restaurant ID
// @route   GET /api/foods/restaurant/:restaurantId
const getFoodsByRestaurant = async (req, res) => {
  try {
    const foods = await FoodItem.find({ restaurant: req.params.restaurantId });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a food item (Admin / Owner)
// @route   POST /api/foods
const createFood = async (req, res) => {
  try {
    const { restaurant, name, description, price, image, category, isVeg, isAvailable } = req.body;

    const food = new FoodItem({
      restaurant,
      name,
      description,
      price,
      image,
      category,
      isVeg: isVeg !== undefined ? isVeg : true,
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    const createdFood = await food.save();
    res.status(201).json(createdFood);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update food item
// @route   PUT /api/foods/:id
const updateFood = async (req, res) => {
  try {
    const food = await FoodItem.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: "Food item not found" });
    }

    Object.assign(food, req.body);
    const updatedFood = await food.save();
    res.json(updatedFood);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete food item
// @route   DELETE /api/foods/:id
const deleteFood = async (req, res) => {
  try {
    const food = await FoodItem.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: "Food item not found" });
    }

    await food.deleteOne();
    res.json({ message: "Food item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFoods,
  getFoodsByRestaurant,
  createFood,
  updateFood,
  deleteFood
};
