const express = require("express");
const {
  createOrder,
  getPaymentOptions,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createCashfreeOrder,
  verifyCashfreeOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrdersForAdmin
} = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/payment-options", getPaymentOptions);
router.post("/", protect, createOrder);
router.post("/cashfree", protect, createCashfreeOrder);
router.post("/cashfree/verify", protect, verifyCashfreeOrder);
router.post("/razorpay", protect, createRazorpayOrder);
router.post("/razorpay/verify", protect, verifyRazorpayPayment);
router.get("/my-orders", protect, getMyOrders);
router.get("/admin/all", protect, adminOnly, getAllOrdersForAdmin);
router.get("/:id", protect, getOrderById);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;
