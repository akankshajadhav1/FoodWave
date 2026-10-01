import React from "react";
import { Link } from "react-router-dom";
import { Star, Clock } from "lucide-react";

const RestaurantCard = ({ restaurant }) => {
  return (
    <Link
      to={`/restaurant/${restaurant._id}`}
      className="group bg-[#FFFDF7] rounded-2xl overflow-hidden shadow-xs hover:shadow-xl border border-[#F0EAF8] transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="relative aspect-video overflow-hidden bg-[#F0EAF8]">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500";
          }}
        />
        {!restaurant.isOpen && (
          <div className="absolute inset-0 bg-[#292329]/70 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-red-700 text-[#FFFDF7] font-bold text-xs uppercase px-3 py-1 rounded-full">
              Currently Closed
            </span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-[#FFFDF7]/95 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-xs border border-[#F0EAF8]">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span className="text-xs font-bold text-[#292329]">{restaurant.rating || 4.2}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-[#292329] group-hover:text-[#B85C3B] transition truncate">
          {restaurant.name}
        </h3>
        
        <p className="text-xs font-medium text-[#292329]/60 mt-1 truncate">
          {Array.isArray(restaurant.cuisines) ? restaurant.cuisines.join(", ") : restaurant.cuisines}
        </p>

        <div className="mt-4 pt-3 border-t border-[#F0EAF8] flex items-center justify-between text-xs text-[#292329]/80 font-semibold">
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-[#B85C3B]" />
            <span>{restaurant.deliveryTime || "30-35 min"}</span>
          </div>
          <div className="flex items-center text-[#B85C3B] font-bold">
            <span>₹{restaurant.costForTwo} for two</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
