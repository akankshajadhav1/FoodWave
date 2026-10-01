const Restaurant = require("../models/Restaurant");

// @desc    Get all restaurants with search & filters
// @route   GET /api/restaurants
const getRestaurants = async (req, res) => {
  try {
    const { search, cuisine, rating, sort } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (cuisine) {
      query.cuisines = { $in: [cuisine] };
    }

    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    let sortOptions = {};
    if (sort === "rating") {
      sortOptions = { rating: -1 };
    } else if (sort === "cost_low") {
      sortOptions = { costForTwo: 1 };
    } else if (sort === "cost_high") {
      sortOptions = { costForTwo: -1 };
    }

    const restaurants = await Restaurant.find(query).sort(sortOptions);
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single restaurant by ID
// @route   GET /api/restaurants/:id
const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new restaurant (Admin / Owner)
// @route   POST /api/restaurants
const createRestaurant = async (req, res) => {
  try {
    const { name, image, cuisines, rating, deliveryTime, costForTwo, address, isOpen } = req.body;

    const restaurant = new Restaurant({
      name,
      image,
      cuisines: Array.isArray(cuisines) ? cuisines : cuisines.split(",").map(c => c.trim()),
      rating: rating || 4.2,
      deliveryTime: deliveryTime || "30-40 min",
      costForTwo,
      address,
      isOpen: isOpen !== undefined ? isOpen : true,
      owner: req.user._id
    });

    const createdRestaurant = await restaurant.save();
    res.status(201).json(createdRestaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
const updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    Object.assign(restaurant, req.body);
    const updatedRestaurant = await restaurant.save();
    res.json(updatedRestaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    await restaurant.deleteOne();
    res.json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
};
