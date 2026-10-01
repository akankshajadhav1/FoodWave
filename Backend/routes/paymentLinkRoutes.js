const express = require("express");
const { createPaymentLink, getPaymentLinkStatus } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create-payment-link", protect, createPaymentLink);
router.get("/payment-link/:id", protect, getPaymentLinkStatus);

module.exports = router;
