import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag, Store } from "lucide-react";

const Cart = () => {
  const { cartItems, restaurant, updateQuantity, clearCart, subtotal, deliveryFee, tax, grandTotal } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-[#FFFDF7]">
        <div className="w-20 h-20 bg-[#F0EAF8] text-[#B85C3B] rounded-full flex items-center justify-center mb-4 border border-[#B9A7E0]/40">
          <ShoppingBag className="w-10 h-10 text-[#B85C3B]" />
        </div>
        <h2 className="text-2xl font-black text-[#292329]">Your Cart is Empty</h2>
        <p className="text-xs text-[#292329]/70 mt-2 max-w-sm">
          Good food is always waiting for you. Discover top restaurants near you!
        </p>
        <Link
          to="/"
          className="mt-6 bg-[#B85C3B] text-[#FFFDF7] font-bold px-6 py-3 rounded-full hover:bg-[#B85C3B]/90 shadow-md shadow-[#B85C3B]/20 transition"
        >
          Browse Food & Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#FFFDF7]">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#F0EAF8]">
        <div>
          <h1 className="text-3xl font-black text-[#292329]">Your Cart</h1>
          {restaurant && (
            <p className="text-xs text-[#292329]/70 mt-1 flex items-center space-x-1 font-semibold">
              <Store className="w-3.5 h-3.5 text-[#B85C3B]" />
              <span>Ordering from {restaurant.name}</span>
            </p>
          )}
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-red-600 font-bold hover:underline flex items-center space-x-1"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item._id}
              className="bg-[#FFFDF7] rounded-2xl p-4 border border-[#F0EAF8] shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover bg-[#F0EAF8]"
                />
                <div>
                  <h4 className="font-bold text-[#292329] text-base">{item.name}</h4>
                  <p className="text-xs text-[#292329]/60 mt-0.5">₹{item.price} each</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Quantity modifier */}
                <div className="bg-[#F0EAF8] text-[#292329] flex items-center space-x-3 px-3 py-1.5 rounded-xl font-bold text-sm border border-[#B9A7E0]/40">
                  <button
                    onClick={() => updateQuantity(item._id, -1)}
                    className="hover:text-[#B85C3B] transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item._id, 1)}
                    className="hover:text-[#B85C3B] transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="font-black text-[#B85C3B] text-base w-20 text-right">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bill Details & Summary */}
        <div className="bg-[#FFFDF7] rounded-3xl p-6 border border-[#F0EAF8] shadow-lg h-fit">
          <h3 className="text-lg font-bold text-[#292329] mb-4 pb-3 border-b border-[#F0EAF8]">
            Bill Details
          </h3>

          <div className="space-y-3 text-xs text-[#292329]/80">
            <div className="flex justify-between">
              <span>Item Total</span>
              <span className="font-bold text-[#292329]">₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-bold text-[#292329]">
                {deliveryFee === 0 ? <span className="text-green-700 font-bold">FREE</span> : `₹${deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Taxes & Charges (5%)</span>
              <span className="font-bold text-[#292329]">₹{tax}</span>
            </div>
            <div className="pt-3 border-t border-[#F0EAF8] flex justify-between text-base font-black text-[#292329]">
              <span>To Pay</span>
              <span className="text-[#B85C3B] text-xl">₹{grandTotal}</span>
            </div>
          </div>

          <button
            onClick={() => navigate("/checkout")}
            className="mt-6 w-full bg-[#B85C3B] hover:bg-[#B85C3B]/90 text-[#FFFDF7] font-bold py-3.5 rounded-2xl shadow-lg shadow-[#B85C3B]/20 flex items-center justify-center space-x-2 transition active:scale-98"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-5 h-5 text-[#B9A7E0]" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Cart;
