import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, Store, Utensils, ShoppingBag, ShieldAlert, Trash2, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [orderStatusErrors, setOrderStatusErrors] = useState({});
  const [restaurants, setRestaurants] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for new restaurant
  const [newRes, setNewRes] = useState({
    name: "",
    image: "",
    cuisines: "North Indian, Fast Food",
    costForTwo: 400,
    address: "MG Road",
    deliveryTime: "30-35 min"
  });

  // Form states for new food
  const [newFood, setNewFood] = useState({
    restaurant: "",
    name: "",
    description: "",
    price: 200,
    image: "",
    category: "Biryani",
    isVeg: true
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordRes, resRes, foodRes] = await Promise.all([
        axios.get("/api/orders/admin/all"),
        axios.get("/api/restaurants"),
        axios.get("/api/foods")
      ]);
      setOrders(ordRes.data);
      setRestaurants(resRes.data);
      setFoods(foodRes.data);
      if (resRes.data.length > 0 && !newFood.restaurant) {
        setNewFood(prev => ({ ...prev, restaurant: resRes.data[0]._id }));
      }
    } catch (err) {
      console.error("Admin data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [newFood.restaurant]);

  const refreshOrders = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/orders/admin/all");
      setOrders(data);
    } catch (err) {
      console.error("Admin order refresh failed:", err);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "admin" && user?.role !== "restaurant_owner") return;
    fetchData();
    const intervalId = window.setInterval(refreshOrders, 15000);
    return () => window.clearInterval(intervalId);
  }, [user, fetchData, refreshOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      setOrderStatusErrors((currentErrors) => ({ ...currentErrors, [orderId]: "" }));
      const { data } = await axios.put(`/api/orders/${orderId}/status`, { orderStatus: newStatus });
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId ? { ...order, orderStatus: data.orderStatus } : order
        )
      );
    } catch (err) {
      console.error("Order status update failed:", err);
      const message = err.response?.data?.message ||
        (err.response?.status === 403
          ? "Your account needs an admin or restaurant-owner role to update order status."
          : err.code === "ERR_NETWORK"
            ? "Cannot reach the backend. Check that it is running on port 5001."
            : `Status update failed${err.response?.status ? ` (HTTP ${err.response.status})` : ""}. Check the backend and try again.`);
      setOrderStatusErrors((currentErrors) => ({ ...currentErrors, [orderId]: message }));
    } finally {
      setUpdatingOrderId("");
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/restaurants", newRes);
      alert("Restaurant created successfully!");
      setNewRes({ name: "", image: "", cuisines: "North Indian", costForTwo: 400, address: "", deliveryTime: "30-35 min" });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create restaurant");
    }
  };

  const handleCreateFood = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/foods", newFood);
      alert("Food item added successfully!");
      setNewFood({ ...newFood, name: "", description: "", price: 200, image: "" });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create food item");
    }
  };

  const handleDeleteFood = async (id) => {
    if (window.confirm("Delete this food item?")) {
      await axios.delete(`/api/foods/${id}`);
      fetchData();
    }
  };

  if (user && user.role !== "admin" && user.role !== "restaurant_owner") {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-xs text-gray-500 mt-1">Admin privileges required to view dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Admin & Owner Dashboard</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">Manage restaurants, food menu, and customer orders</p>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          {[
            { id: "orders", label: "Orders", icon: ShoppingBag },
            { id: "restaurants", label: "Restaurants", icon: Store },
            { id: "food", label: "Food Items", icon: Utensils }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === tab.id
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Live Customer Orders ({orders.length})</h2>
          <p className="text-xs text-gray-500">Orders refresh automatically every 15 seconds.</p>
          {orders.map((ord) => (
            <div key={ord._id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="font-extrabold text-base text-gray-900">Order #{ord._id.slice(-6).toUpperCase()}</span>
                  <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2.5 py-0.5 rounded-full">
                    {ord.orderStatus}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Customer: {ord.user?.name} ({ord.user?.phone || "No phone"})</p>
                <p className="text-xs text-gray-500">Address: {ord.deliveryAddress?.street}, {ord.deliveryAddress?.city}</p>
                <p className="text-xs text-gray-500">
                  Payment: {ord.paymentMethod} · {ord.paymentStatus}
                </p>
                {ord.paymentMethod !== "COD" && ord.paymentStatus !== "paid" && (
                  <p className="text-xs font-semibold text-amber-700">
                    Payment is pending. This order can only be cancelled until payment is confirmed.
                  </p>
                )}
                <div className="text-xs font-medium text-gray-700">
                  Items: {ord.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                </div>
              </div>

              <div className="flex flex-col justify-between items-end gap-3">
                <span className="text-xl font-black text-gray-900">₹{ord.total}</span>
                
                {/* Status Updater */}
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-bold text-gray-500">Status:</label>
                  <select
                    value={ord.orderStatus}
                    onChange={(e) => handleUpdateStatus(ord._id, e.target.value)}
                    disabled={updatingOrderId === ord._id}
                    className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                  >
                    {ord.paymentMethod !== "COD" && ord.paymentStatus !== "paid" ? (
                      <>
                        <option value="Awaiting Payment">Awaiting Payment</option>
                        <option value="Cancelled">Cancelled</option>
                      </>
                    ) : (
                      <>
                        <option value="Placed">Placed</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </>
                    )}
                  </select>
                </div>
                {orderStatusErrors[ord._id] && (
                  <p role="alert" className="max-w-xs text-right text-xs font-semibold text-red-700">
                    {orderStatusErrors[ord._id]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Restaurants Tab */}
      {activeTab === "restaurants" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm lg:col-span-1 h-fit">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Add New Restaurant</h3>
            <form onSubmit={handleCreateRestaurant} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 uppercase">Name</label>
                <input
                  type="text"
                  required
                  value={newRes.name}
                  onChange={(e) => setNewRes({ ...newRes, name: e.target.value })}
                  placeholder="Spice Garden"
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 uppercase">Image URL</label>
                <input
                  type="text"
                  required
                  value={newRes.image}
                  onChange={(e) => setNewRes({ ...newRes, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 uppercase">Cuisines (comma separated)</label>
                <input
                  type="text"
                  required
                  value={newRes.cuisines}
                  onChange={(e) => setNewRes({ ...newRes, cuisines: e.target.value })}
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 uppercase">Cost For Two (₹)</label>
                <input
                  type="number"
                  required
                  value={newRes.costForTwo}
                  onChange={(e) => setNewRes({ ...newRes, costForTwo: Number(e.target.value) })}
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 uppercase">Address</label>
                <input
                  type="text"
                  required
                  value={newRes.address}
                  onChange={(e) => setNewRes({ ...newRes, address: e.target.value })}
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-orange-700 transition"
              >
                Add Restaurant
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-lg text-gray-900">Existing Restaurants ({restaurants.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {restaurants.map((res) => (
                <div key={res._id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-4">
                  <img src={res.image} alt={res.name} className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-gray-900">{res.name}</h4>
                    <p className="text-xs text-gray-500">{res.address}</p>
                    <span className="text-[11px] font-bold text-orange-600">₹{res.costForTwo} for two</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Food Items Tab */}
      {activeTab === "food" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm lg:col-span-1 h-fit">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Add Food Item</h3>
            <form onSubmit={handleCreateFood} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 uppercase">Select Restaurant</label>
                <select
                  value={newFood.restaurant}
                  onChange={(e) => setNewFood({ ...newFood, restaurant: e.target.value })}
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold"
                >
                  {restaurants.map((r) => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-gray-700 uppercase">Dish Name</label>
                <input
                  type="text"
                  required
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  placeholder="Paneer Biryani"
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 uppercase">Price (₹)</label>
                <input
                  type="number"
                  required
                  value={newFood.price}
                  onChange={(e) => setNewFood({ ...newFood, price: Number(e.target.value) })}
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 uppercase">Image URL</label>
                <input
                  type="text"
                  required
                  value={newFood.image}
                  onChange={(e) => setNewFood({ ...newFood, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 uppercase">Category</label>
                <input
                  type="text"
                  required
                  value={newFood.category}
                  onChange={(e) => setNewFood({ ...newFood, category: e.target.value })}
                  placeholder="Biryani / Pizza / Burger"
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isVeg"
                  checked={newFood.isVeg}
                  onChange={(e) => setNewFood({ ...newFood, isVeg: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <label htmlFor="isVeg" className="font-bold text-gray-700">Pure Veg</label>
              </div>
              <button
                type="submit"
                className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-orange-700 transition"
              >
                Add Food Item
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-lg text-gray-900">Food Menu ({foods.length} items)</h3>
            <div className="space-y-3">
              {foods.map((food) => (
                <div key={food._id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img src={food.image} alt={food.name} className="w-14 h-14 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-gray-900">{food.name}</h4>
                      <p className="text-xs text-gray-500">{food.category} • ₹{food.price}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFood(food._id)}
                    className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
