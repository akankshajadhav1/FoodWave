import React from "react";
import { useCart } from "../context/CartContext";
import { Plus, Minus } from "lucide-react";

const FoodCard = ({ food, restaurant }) => {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const cartItem = cartItems.find((i) => i._id === food._id);

  return (
    <div className="flex bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition group">
      
      {/* Food Info */}
      <div className="flex-1 pr-4 flex flex-col justify-between">
        <div>
          {/* Veg/Non-veg tag */}
          <div className="flex items-center space-x-2">
            <span
              className={`w-3.5 h-3.5 rounded-xs border-2 flex items-center justify-center ${
                food.isVeg ? "border-green-600" : "border-red-600"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  food.isVeg ? "bg-green-600" : "bg-red-600"
                }`}
              ></span>
            </span>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              {food.category}
            </span>
          </div>

          <h4 className="font-bold text-gray-900 text-base mt-1 group-hover:text-orange-600 transition">
            {food.name}
          </h4>

          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {food.description}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="font-extrabold text-gray-900 text-base">₹{food.price}</span>
        </div>
      </div>

      {/* Food Image & Add Button */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0">
        <img
          src={food.image}
          alt={food.name}
          className="w-full h-full object-cover rounded-xl bg-gray-100"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500";
          }}
        />

        {cartItem ? (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-600 text-white flex items-center space-x-2 px-3 py-1 rounded-lg shadow-md font-bold text-sm">
            <button
              onClick={() => updateQuantity(food._id, -1)}
              className="hover:opacity-75 transition"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span>{cartItem.quantity}</span>
            <button
              onClick={() => updateQuantity(food._id, 1)}
              className="hover:opacity-75 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => addToCart(food, restaurant)}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-orange-600 border border-orange-200 hover:bg-orange-600 hover:text-white font-bold text-xs uppercase px-4 py-1.5 rounded-lg shadow-md transition-all active:scale-95"
          >
            Add +
          </button>
        )}
      </div>

    </div>
  );
};

export default FoodCard;
