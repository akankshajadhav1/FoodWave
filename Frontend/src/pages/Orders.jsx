import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { CheckCircle2, Package, Bike, CheckCircle, ChefHat, FileText, RefreshCw, Clock3 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

const getDeliveryEstimate = (createdAt, deliveryTime, now) => {
  const timeRange = deliveryTime?.match(/(\d+)\s*-\s*(\d+)/);
  const minimumMinutes = Number(timeRange?.[1] || 30);
  const maximumMinutes = Number(timeRange?.[2] || 40);
  const placedAt = new Date(createdAt);

  if (Number.isNaN(placedAt.getTime())) return "";

  const formatTime = (minutes) =>
    new Date(placedAt.getTime() + minutes * 60_000).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });

  const remainingMinutes = Math.max(
    0,
    Math.ceil((placedAt.getTime() + maximumMinutes * 60_000 - now.getTime()) / 60_000)
  );

  return {
    remainingMinutes,
    arrivalWindow: `${formatTime(minimumMinutes)}–${formatTime(maximumMinutes)}`
  };
};

const Orders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const requestInFlight = useRef(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const statusSteps = [
    { label: "Placed", icon: Package },
    { label: "Accepted", icon: CheckCircle2 },
    { label: "Preparing", icon: ChefHat },
    { label: "Out for Delivery", icon: Bike },
    { label: "Delivered", icon: CheckCircle }
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case "Placed": return 0;
      case "Accepted": return 1;
      case "Preparing": return 2;
      case "Out for Delivery": return 3;
      case "Delivered": return 4;
      default: return 0;
    }
  };

  const fetchOrders = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setRefreshing(true);
    try {
      const { data } = await axios.get("/api/orders/my-orders", {
        headers: { "Cache-Control": "no-cache" },
        timeout: 8000
      });
      setOrders(data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch orders:", {
        message: err.message,
        code: err.code,
        status: err.response?.status
      });
      const message = err.response?.data?.message
        || (err.code === "ERR_NETWORK"
          ? "Cannot reach the orders API. Make sure the backend server is running on port 5001."
          : `Could not load orders: ${err.message}`);
      setError(`${message} Retrying automatically.`);
    } finally {
      requestInFlight.current = false;
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const refreshIfMounted = () => {
      if (isMounted) fetchOrders();
    };

    refreshIfMounted();
    const intervalId = window.setInterval(refreshIfMounted, 2000);
    window.addEventListener("focus", refreshIfMounted);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfMounted);
    };
  }, [fetchOrders]);

  useEffect(() => {
    const timerId = window.setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    const cashfreeOrderId = searchParams.get("cashfree_order_id");
    if (!cashfreeOrderId) return undefined;

    let isMounted = true;
    const verifyPayment = async () => {
      try {
        await axios.post("/api/orders/cashfree/verify", { cashfreeOrderId });
      } catch (err) {
        console.error("Cashfree return verification failed:", err);
        if (isMounted) {
          setError(err.response?.data?.message || "Payment status is still being confirmed. Please refresh shortly.");
        }
      } finally {
        if (isMounted) {
          const nextSearchParams = new URLSearchParams(searchParams);
          nextSearchParams.delete("cashfree_order_id");
          setSearchParams(nextSearchParams, { replace: true });
        }
      }
    };

    verifyPayment();
    return () => {
      isMounted = false;
    };
  }, [searchParams, setSearchParams]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        {[1, 2].map((n) => (
          <div key={n} className="bg-[#F0EAF8] h-48 rounded-3xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (orders.length === 0 && !error) {
    return (
      <div className="text-center py-20 bg-[#FFFDF7]">
        <Package className="w-12 h-12 text-[#B9A7E0] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-[#292329]">No orders placed yet</h2>
        <p className="text-xs text-[#292329]/60 mt-1">When you place orders, they will show up here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 bg-[#FFFDF7]">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-[#292329]">My Orders</h1>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          disabled={refreshing}
          aria-label="Refresh orders"
          title="Refresh orders"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#B85C3B]/30 text-[#B85C3B] transition hover:bg-[#F0EAF8] disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw aria-hidden="true" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="space-y-6">
        {error && (
          <p role="status" className="text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        {/*         <p className="text-xs text-[#292329]/60">Order status refreshes automatically every 2 seconds.</p> */}
        {orders.map((order) => {
          const currentStep = getStepIndex(order.orderStatus);
          const awaitingPayment = order.orderStatus === "Awaiting Payment";
          const cancelled = order.orderStatus === "Cancelled";

          return (
            <div
              key={order._id}
              className="bg-[#FFFDF7] rounded-3xl p-6 border border-[#F0EAF8] shadow-md space-y-6"
            >
              {/* Order Top Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0EAF8]">
                <div className="flex items-center space-x-4">
                  {order.restaurant?.image && (
                    <img
                      src={order.restaurant.image}
                      alt={order.restaurant.name}
                      className="w-12 h-12 rounded-xl object-cover bg-[#F0EAF8]"
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-[#292329]">
                      {order.restaurant?.name || "Restaurant"}
                    </h3>
                    <p className="text-xs text-[#292329]/60 font-medium">
                      Order #{order._id.slice(-6).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    {!awaitingPayment && !cancelled && order.orderStatus !== "Delivered" && (
                      (() => {
                        const estimate = getDeliveryEstimate(
                          order.createdAt,
                          order.restaurant?.deliveryTime,
                          currentTime
                        );
                        if (!estimate) return null;

                        return (
                          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#B85C3B]">
                            <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                            {estimate.remainingMinutes > 0
                              ? `Arriving in ${estimate.remainingMinutes} min`
                              : "Estimated arrival time reached"}
                            {" · "}
                            {estimate.arrivalWindow}
                          </p>
                        );
                      })()
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs uppercase font-bold px-3 py-1 rounded-full bg-[#F0EAF8] text-[#B85C3B] border border-[#B9A7E0]/40">
                    {order.orderStatus}
                  </span>
                  <p className="text-lg font-black text-[#B85C3B] mt-1">₹{order.total}</p>
                  <p className="text-[11px] text-[#292329]/60 mt-1">
                    {order.paymentMethod === "COD"
                      ? "Cash on Delivery"
                      : `${order.paymentMethod} payment · ${order.paymentStatus}`}
                  </p>
                </div>
              </div>

              {/* Order Status Progress Tracker */}
              {awaitingPayment ? (
                <p className="rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-800">
                  Payment is incomplete. This order has not been sent to the restaurant.
                </p>
              ) : cancelled ? (
                <p className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800">
                  This order was cancelled.
                </p>
              ) : (
                <div className="py-2">
                  <div className="grid grid-cols-5 gap-2 relative">
                    {statusSteps.map((step, idx) => {
                      const IconComponent = step.icon;
                      const isPassed = idx <= currentStep;
                      const isCurrent = idx === currentStep;

                      return (
                        <div key={step.label} className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              isPassed
                                ? "bg-[#B85C3B] text-[#FFFDF7] shadow-md"
                                : "bg-[#F0EAF8] text-[#292329]/40"
                            } ${isCurrent ? "ring-4 ring-[#B9A7E0] scale-110" : ""}`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-[11px] font-bold mt-2 ${
                              isPassed ? "text-[#292329]" : "text-[#292329]/40"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ordered Items summary */}
              <div className="bg-[#F0EAF8] rounded-2xl p-4 text-xs text-[#292329]/80 space-y-1">
                <p className="font-bold text-[#292329] mb-2">Items Ordered:</p>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-bold text-[#B85C3B]">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              {!awaitingPayment && (
                <Link
                  to={`/orders/${order._id}/invoice`}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#B85C3B]/30 px-4 py-2.5 text-sm font-bold text-[#B85C3B] transition hover:bg-[#F0EAF8]"
                >
                  <FileText className="h-4 w-4" />
                  View / Download Invoice
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
