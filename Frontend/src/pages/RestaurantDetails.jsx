import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import FoodCard from "../components/FoodCard";
import { Star, Clock, MapPin, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";

const RestaurantDetails = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dietaryFilter, setDietaryFilter] = useState("all");
  const { totalItemsCount, grandTotal } = useCart();

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        const [resRes, foodRes] = await Promise.all([
          axios.get(`/api/restaurants/${id}`),
          axios.get(`/api/foods/restaurant/${id}`)
        ]);
        setRestaurant(resRes.data);
        setFoods(foodRes.data);
      } catch (err) {
        console.error("Failed to load restaurant:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurantData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-[#F0EAF8] h-64 rounded-3xl animate-pulse"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-[#292329]">Restaurant not found</h2>
        <Link to="/" className="text-[#B85C3B] text-sm font-bold mt-4 inline-block">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const categories = ["All", ...new Set(foods.map((f) => f.category))];

  const filteredFoods = foods.filter((f) => {
    const matchesCategory = selectedCategory === "All" || f.category === selectedCategory;
    const matchesDiet =
      dietaryFilter === "all" ||
      (dietaryFilter === "veg" && f.isVeg === true) ||
      (dietaryFilter === "non-veg" && f.isVeg === false);
    return matchesCategory && matchesDiet;
  });

  return (
    <div className="min-h-screen pb-24 bg-[#FFFDF7]">
      
      {/* Header Banner */}
      <div className="bg-[#B85C3B] text-[#FFFDF7] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#B9A7E0] hover:text-[#FFFDF7] mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Restaurants</span>
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-[#B9A7E0]/40 shadow-xl"
              />
              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-[#FFFDF7]">{restaurant.name}</h1>
                <p className="text-xs sm:text-sm text-[#F0EAF8]/80 font-medium mt-1">
                  {Array.isArray(restaurant.cuisines) ? restaurant.cuisines.join(", ") : restaurant.cuisines}
                </p>
                <div className="flex items-center space-x-2 text-xs text-[#B9A7E0] mt-2">
                  <MapPin className="w-3.5 h-3.5 text-[#B9A7E0]" />
                  <span>{restaurant.address}</span>
                </div>
              </div>
            </div>

            {/* Quick Badges */}
            <div className="flex items-center space-x-3 bg-[#B9A7E0]/10 border border-[#B9A7E0]/20 backdrop-blur-md p-3.5 rounded-2xl text-xs font-semibold">
              <div className="flex items-center space-x-1 text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="text-[#FFFDF7] font-bold">{restaurant.rating || 4.2}</span>
              </div>
              <div className="h-4 w-px bg-[#FFFDF7]/20"></div>
              <div className="flex items-center space-x-1 text-[#F0EAF8]">
                <Clock className="w-4 h-4 text-[#B9A7E0]" />
                <span>{restaurant.deliveryTime}</span>
              </div>
              <div className="h-4 w-px bg-[#FFFDF7]/20"></div>
              <div className="text-[#F0EAF8]">₹{restaurant.costForTwo} for two</div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Categories & Dietary Bar */}
      <div className="sticky top-20 z-40 bg-[#FFFDF7] border-b border-[#F0EAF8] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? "bg-[#B85C3B] text-[#FFFDF7] shadow-md"
                    : "bg-[#F0EAF8] text-[#292329] hover:bg-[#B9A7E0]/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Veg / Non-Veg Toggles */}
          <div className="flex bg-[#F0EAF8] p-1.5 rounded-2xl border border-[#B9A7E0]/40 self-start sm:self-auto">
            <button
              onClick={() => setDietaryFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                dietaryFilter === "all"
                  ? "bg-[#B85C3B] text-[#FFFDF7] shadow-xs"
                  : "text-[#292329] hover:text-[#B85C3B]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietaryFilter("veg")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                dietaryFilter === "veg"
                  ? "bg-green-700 text-white shadow-xs"
                  : "text-[#292329] hover:text-green-700"
              }`}
            >
              <span>🌱 Veg</span>
            </button>
            <button
              onClick={() => setDietaryFilter("non-veg")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                dietaryFilter === "non-veg"
                  ? "bg-red-700 text-white shadow-xs"
                  : "text-[#292329] hover:text-red-700"
              }`}
            >
              <span>🍗 Non-Veg</span>
            </button>
          </div>

        </div>
      </div>

      {/* Food Items List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <h2 className="text-xl font-black text-[#292329] mb-6">
          Menu ({filteredFoods.length} items)
        </h2>

        {filteredFoods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFoods.map((food) => (
              <FoodCard key={food._id} food={food} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[#FFFDF7] rounded-2xl border border-[#F0EAF8]">
            <p className="text-sm font-semibold text-[#292329]/60">No dishes match the selected category & dietary filter.</p>
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
          <Link
            to="/cart"
            className="bg-[#B85C3B] hover:bg-[#B85C3B]/90 text-[#FFFDF7] rounded-2xl p-4 shadow-2xl flex items-center justify-between transition-all duration-300 active:scale-98"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#B9A7E0]/30 text-[#FFFDF7] flex items-center justify-center font-black">
                {totalItemsCount}
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-[#B9A7E0]">Cart Total</p>
                <p className="text-lg font-black text-[#FFFDF7]">₹{grandTotal}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 font-bold text-sm text-[#FFFDF7]">
              <span>View Cart</span>
              <ShoppingBag className="w-4 h-4 ml-1 text-[#B9A7E0]" />
            </div>
          </Link>
        </div>
      )}

    </div>
  );
};

export default RestaurantDetails;
