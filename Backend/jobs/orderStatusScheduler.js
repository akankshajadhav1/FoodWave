const Order = require("../models/Order");

const STATUS_TRANSITIONS = [
  ["Placed", "Accepted"],
  ["Accepted", "Preparing"],
  ["Preparing", "Out for Delivery"],
  ["Out for Delivery", "Delivered"]
];
const TRANSITION_DELAY_MS = 3 * 60 * 1000;
const CHECK_INTERVAL_MS = 10 * 1000;

let running = false;

const advanceEligibleOrders = async () => {
  if (running) return;
  running = true;

  try {
    const cutoff = new Date(Date.now() - TRANSITION_DELAY_MS);

    for (const [currentStatus, nextStatus] of STATUS_TRANSITIONS) {
      await Order.updateMany(
        {
          orderStatus: currentStatus,
          updatedAt: { $lte: cutoff },
          $or: [{ paymentMethod: "COD" }, { paymentStatus: "paid" }]
        },
        { $set: { orderStatus: nextStatus } }
      );
    }
  } catch (error) {
    console.error("Automatic order status update failed:", error);
  } finally {
    running = false;
  }
};

const startOrderStatusScheduler = () => {
  void advanceEligibleOrders();
  return setInterval(() => {
    void advanceEligibleOrders();
  }, CHECK_INTERVAL_MS);
};

module.exports = startOrderStatusScheduler;
