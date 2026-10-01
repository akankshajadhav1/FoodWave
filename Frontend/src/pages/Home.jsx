import React, { useState, useEffect } from "react";
import axios from "axios";
import RestaurantCard from "../components/RestaurantCard";
import { Search, Sparkles, Utensils } from "lucide-react";

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resRes, catRes] = await Promise.all([
          axios.get("/api/restaurants"),
          axios.get("/api/categories")
        ]);
        setRestaurants(resRes.data);
        setCategories(catRes.data);
      } catch (err) {
        console.error("Failed to load home data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(r.cuisines) && r.cuisines.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory = !selectedCategory || (Array.isArray(r.cuisines) && r.cuisines.includes(selectedCategory));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-16 bg-gradient-to-b from-[#FFFDF7] via-[#F0EAF8] to-[#FCE8DE]">
      
      {/* Hero Search Section */}
      <section className="relative bg-[#B85C3B] text-[#FFFDF7] py-16 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#B9A7E0_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-[#B9A7E0]/20 border border-[#B9A7E0]/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#292329] mb-6">
            <Sparkles className="w-4 h-4 text-[#292329]" />
            <span>Fastest Food Delivery in Town</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-[#FFFDF7]">
            Craving something delicious? <br className="hidden sm:inline" />
            <span className="text-[#B9A7E0]">We got you covered.</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-[#F0EAF8]/80 max-w-2xl mx-auto font-medium">
            Order food from top restaurants near you with lightning fast delivery.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto relative">
            <div className="flex items-center bg-[#FFFDF7] border-2 border-[#B9A7E0] rounded-2xl p-2 shadow-2xl">
              <Search className="w-6 h-6 text-[#B85C3B] ml-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for restaurants, cuisines or dishes..."
                className="w-full px-4 py-3 text-[#292329] placeholder-[#292329]/50 bg-transparent text-sm sm:text-base focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-[#B85C3B] hover:opacity-75 px-3 font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-[#FFFDF7] rounded-2xl p-4 shadow-md border border-[#F0EAF8] flex items-center space-x-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-2 ${
              selectedCategory === ""
                ? "bg-[#B85C3B] text-[#FFFDF7] shadow-md"
                : "bg-[#F0EAF8] text-[#292329] hover:bg-[#B9A7E0]/30"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat.name === selectedCategory ? "" : cat.name)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-2 ${
                selectedCategory === cat.name
                  ? "bg-[#B85C3B] text-[#FFFDF7] shadow-md"
                  : "bg-[#F0EAF8] text-[#292329] hover:bg-[#B9A7E0]/30"
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Restaurants Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-[#F0EAF8] gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#292329] tracking-tight">Popular Restaurants</h2>
            <p className="text-xs text-[#292329]/70 font-medium mt-1">
              Explore top-rated eateries delivering right now
            </p>
          </div>

          {/* All / Veg / Non-Veg Filter Controls */}
          <div className="flex bg-[#F0EAF8] p-1.5 rounded-2xl border border-[#B9A7E0]/40">
            <button
              onClick={() => setDietaryFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                dietaryFilter === "all"
                  ? "bg-[#B85C3B] text-[#FFFDF7] shadow-xs"
                  : "text-[#292329] hover:text-[#B85C3B]"
              }`}
            >
              All Food
            </button>
            <button
              onClick={() => setDietaryFilter("veg")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                dietaryFilter === "veg"
                  ? "bg-green-700 text-white shadow-xs"
                  : "text-[#292329] hover:text-green-700"
              }`}
            >
              <span>🌱 Pure Veg</span>
            </button>
            <button
              onClick={() => setDietaryFilter("non-veg")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                dietaryFilter === "non-veg"
                  ? "bg-red-700 text-white shadow-xs"
                  : "text-[#292329] hover:text-red-700"
              }`}
            >
              <span>🍗 Non-Veg</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-[#F0EAF8] h-64 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((res) => (
              <RestaurantCard key={res._id} restaurant={res} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#FFFDF7] rounded-3xl border border-[#F0EAF8]">
            <Utensils className="w-12 h-12 text-[#B9A7E0] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#292329]">No restaurants found</h3>
            <p className="text-xs text-[#292329]/60 mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
      </section>

    </div>
  );
};

export default Home;
