const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const startOrderStatusScheduler = require("./jobs/orderStatusScheduler");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const foodRoutes = require("./routes/foodRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentLinkRoutes = require("./routes/paymentLinkRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const {
  handleCashfreeWebhook,
  handlePaymentLinkWebhook,
  handleRazorpayWebhook
} = require("./controllers/orderController");

const app = express();

// Connect Database
connectDB();
startOrderStatusScheduler();

// Middleware
app.use(cors());
app.post("/api/orders/cashfree/webhook", express.raw({ type: "application/json" }), handleCashfreeWebhook);
app.post("/api/razorpay-webhook", express.raw({ type: "application/json" }), handlePaymentLinkWebhook);
app.post("/api/orders/razorpay/webhook", express.raw({ type: "application/json" }), handleRazorpayWebhook);
app.use(express.json());

// Routes Middleware
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api", paymentLinkRoutes);
app.use("/api/categories", categoryRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Food Delivery API is running smoothly!",
    endpoints: {
      auth: "/api/auth",
      restaurants: "/api/restaurants",
      foods: "/api/foods",
      orders: "/api/orders",
      categories: "/api/categories"
    }
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});