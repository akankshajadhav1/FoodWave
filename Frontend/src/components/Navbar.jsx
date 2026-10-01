import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ShoppingBag, MapPin, User, LogOut, Shield, UtensilsCrossed } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItemsCount } = useCart();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-[#FFFDF7] border-b border-[#F0EAF8] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Location */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 rounded-2xl bg-[#B85C3B] flex items-center justify-center text-[#B9A7E0] shadow-md shadow-[#B85C3B]/20 group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-[#B85C3B] tracking-tight">
                Food Wave
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-2 bg-[#F0EAF8] px-4 py-2 rounded-full text-xs font-bold text-[#292329] hover:bg-[#B9A7E0]/30 cursor-pointer transition">
              <MapPin className="w-4 h-4 text-[#B85C3B]" />
              <span>Downtown, MG Road</span>
              <span className="text-[10px] text-[#B85C3B]/60">▼</span>
            </div>
          </div>

          {/* Nav Items & User Controls */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            {user && (user.role === "admin" || user.role === "restaurant_owner") && (
              <Link
                to="/admin"
                className="flex items-center space-x-1.5 text-xs font-bold text-[#B85C3B] bg-[#F0EAF8] border border-[#B9A7E0] px-4 py-2 rounded-full hover:bg-[#B9A7E0]/30 transition"
              >
                <Shield className="w-4 h-4 text-[#B85C3B]" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            <Link
              to="/cart"
              className="relative p-2 text-[#292329] hover:text-[#B85C3B] hover:bg-[#F0EAF8] rounded-full transition"
            >
              <ShoppingBag className="w-6 h-6" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#B85C3B] text-[#FFFDF7] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {totalItemsCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-3">
                {user.role !== "admin" && user.role !== "restaurant_owner" && (
                  <Link
                    to="/orders"
                    className="hidden sm:block text-xs font-bold text-[#292329] hover:text-[#B85C3B] transition"
                  >
                    My Orders
                  </Link>
                )}
                <div className="flex items-center space-x-2 bg-[#F0EAF8] border border-[#B9A7E0]/50 py-1.5 px-3.5 rounded-full">
                  <User className="w-4 h-4 text-[#B85C3B]" />
                  <span className="text-xs font-bold text-[#292329]">{user.name.split(" ")[0]}</span>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    title="Logout"
                    className="ml-1 text-gray-400 hover:text-red-600 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-xs font-bold text-[#292329] hover:text-[#B85C3B] px-3 py-2 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-bold text-[#FFFDF7] bg-[#B85C3B] hover:bg-[#B85C3B]/90 px-5 py-2.5 rounded-full shadow-md shadow-[#B85C3B]/20 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
