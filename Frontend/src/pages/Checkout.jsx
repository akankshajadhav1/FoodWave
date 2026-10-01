import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { MapPin, CreditCard, CheckCircle2, Wallet } from "lucide-react";

const Checkout = () => {
  const { cartItems, restaurant, grandTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    street: "123 Green Avenue, Flat 4B",
    city: "Mumbai",
    state: "Maharashtra",
    zipCode: "400001",
    phone: user?.phone || "9876543210"
  });

  const [placing, setPlacing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  if (!user) {
    return (
      <div className="text-center py-20 bg-[#FFFDF7]">
        <h2 className="text-xl font-bold text-[#292329]">Please login to place your order</h2>
        <button
          onClick={() => navigate("/login")}
          className="mt-4 bg-[#B85C3B] text-[#FFFDF7] font-bold px-6 py-2.5 rounded-full"
        >
          Login Now
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!restaurant) return;

    try {
      setPlacing(true);
      setPaymentMessage("");
      const orderPayload = {
        restaurant: restaurant._id,
        items: cartItems.map((item) => ({
          foodItem: item._id,
          quantity: item.quantity
        })),
        deliveryAddress: address
      };

      await axios.post("/api/orders", { ...orderPayload, paymentMethod: "COD" });
      clearCart();
      navigate("/orders");
    } catch (err) {
      console.error("Order placement failed:", err);
      setPaymentMessage(err.response?.data?.message || err.message || "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 bg-[#FFFDF7]">
      <h1 className="text-3xl font-black text-[#292329] mb-8">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="md:col-span-2 space-y-6">
          
          {/* Address Box */}
          <div className="bg-[#FFFDF7] rounded-3xl p-6 border border-[#F0EAF8] shadow-sm">
            <div className="flex items-center space-x-2 text-[#B85C3B] mb-4 font-bold text-lg">
              <MapPin className="w-5 h-5 text-[#B85C3B]" />
              <span>Delivery Address</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#292329] uppercase">Street Address</label>
                <input
                  type="text"
                  required
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full mt-1 p-3.5 bg-[#F0EAF8] border border-[#B9A7E0]/40 rounded-xl text-xs text-[#292329] focus:outline-none focus:border-[#B85C3B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#292329] uppercase">City</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full mt-1 p-3.5 bg-[#F0EAF8] border border-[#B9A7E0]/40 rounded-xl text-xs text-[#292329] focus:outline-none focus:border-[#B85C3B]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#292329] uppercase">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={address.zipCode}
                    onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                    className="w-full mt-1 p-3.5 bg-[#F0EAF8] border border-[#B9A7E0]/40 rounded-xl text-xs text-[#292329] focus:outline-none focus:border-[#B85C3B]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#292329] uppercase">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full mt-1 p-3.5 bg-[#F0EAF8] border border-[#B9A7E0]/40 rounded-xl text-xs text-[#292329] focus:outline-none focus:border-[#B85C3B]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-[#FFFDF7] rounded-3xl p-6 border border-[#F0EAF8] shadow-sm">
            <div className="flex items-center space-x-2 text-[#B85C3B] mb-4 font-bold text-lg">
              <CreditCard className="w-5 h-5 text-[#B85C3B]" />
              <span>Payment Option</span>
            </div>

            <div className="rounded-2xl border-2 border-[#B85C3B] bg-[#F0EAF8] p-4">
              <span className="flex items-center gap-2 font-bold text-xs text-[#292329]">
                <Wallet className="w-4 h-4 text-[#B85C3B]" />
                Cash on Delivery
              </span>
              <p className="text-[11px] text-[#292329]/60 mt-1">Pay cash when your order arrives.</p>
            </div>
          </div>

        </div>

        {/* Order Summary */}
        <div className="bg-[#FFFDF7] rounded-3xl p-6 border border-[#F0EAF8] shadow-lg h-fit space-y-4">
          <h3 className="font-bold text-lg text-[#292329] pb-3 border-b border-[#F0EAF8]">
            Order Summary
          </h3>

          <div className="text-xs text-[#292329]/80 space-y-2">
            <p className="font-bold text-[#292329]">{restaurant?.name}</p>
            <p>{cartItems.length} Food Items</p>
          </div>

          <div className="pt-3 border-t border-[#F0EAF8] flex justify-between font-black text-lg text-[#292329]">
            <span>Total Payable</span>
            <span className="text-[#B85C3B]">₹{grandTotal}</span>
          </div>

          {paymentMessage && (
            <p role="alert" className="text-xs font-medium text-red-700">
              {paymentMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={placing}
            className="w-full bg-[#B85C3B] hover:bg-[#B85C3B]/90 text-[#FFFDF7] font-bold py-3.5 rounded-2xl shadow-lg shadow-[#B85C3B]/20 flex items-center justify-center space-x-2 transition"
          >
            {placing ? (
              <span>Placing Order...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-[#B9A7E0]" />
                <span>Place Order Now</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default Checkout;
