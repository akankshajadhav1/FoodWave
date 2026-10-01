const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  foodItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodItem"
  },
  name: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true
    },
    items: [orderItemSchema],
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      phone: String
    },
    subtotal: {
      type: Number,
      required: true
    },
    deliveryFee: {
      type: Number,
      default: 40
    },
    tax: {
      type: Number,
      default: 20
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Online", "UPI", "Card", "Cashfree"],
      default: "COD"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },
    razorpayOrderId: {
      type: String,
      default: null
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    cashfreeOrderId: {
      type: String,
      default: null
    },
    cashfreePaymentSessionId: {
      type: String,
      default: null
    },
    cashfreeOrderStatus: {
      type: String,
      default: null
    },
    cashfreePaymentIds: {
      type: [String],
      default: []
    },
    paymentLinkId: {
      type: String,
      default: null
    },
    paymentLinkShortUrl: {
      type: String,
      default: null
    },
    paymentLinkStatus: {
      type: String,
      default: null
    },
    paymentLinkReferenceId: {
      type: String,
      default: null
    },
    paymentLinkAmount: {
      type: Number,
      default: null
    },
    paymentLinkCurrency: {
      type: String,
      default: null
    },
    paymentLinkWebhookEventIds: {
      type: [String],
      default: []
    },
    orderStatus: {
      type: String,
      enum: ["Awaiting Payment", "Placed", "Accepted", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
      default: "Placed"
    }
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
