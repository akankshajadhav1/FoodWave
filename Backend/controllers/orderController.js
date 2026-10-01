const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const FoodItem = require("../models/FoodItem");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");

const createHttpError = (status, message) => Object.assign(new Error(message), { status });

const getOrderDetails = async (payload = {}, includeRestaurantName = false) => {
  const { restaurant: restaurantId, items, deliveryAddress } = payload || {};
  if (!mongoose.isValidObjectId(restaurantId)) {
    throw createHttpError(400, "Please select a valid restaurant");
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw createHttpError(400, "Please provide between 1 and 50 order items");
  }
  const addressFields = ["street", "city", "zipCode", "phone"];
  if (
    !deliveryAddress ||
    addressFields.some((field) =>
      typeof deliveryAddress[field] !== "string" ||
      !deliveryAddress[field].trim() ||
      deliveryAddress[field].length > 200
    )
  ) {
    throw createHttpError(400, "Please provide a complete delivery address");
  }

  const quantities = new Map();
  for (const item of items) {
    if (
      !item ||
      typeof item !== "object" ||
      !mongoose.isValidObjectId(item.foodItem) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    ) {
      throw createHttpError(400, "An order item or quantity is invalid");
    }
    const foodId = item.foodItem.toString();
    const quantity = (quantities.get(foodId) || 0) + item.quantity;
    if (quantity > 99) throw createHttpError(400, "An item quantity cannot exceed 99");
    quantities.set(foodId, quantity);
  }

  const [restaurant, foods] = await Promise.all([
    Restaurant.findById(restaurantId).lean(),
    FoodItem.find({ _id: { $in: [...quantities.keys()] } }).lean()
  ]);
  if (!restaurant) throw createHttpError(404, "Restaurant not found");
  if (!restaurant.isOpen) throw createHttpError(400, "This restaurant is currently closed");
  if (foods.length !== quantities.size) throw createHttpError(400, "One or more food items could not be found");
  if (foods.some((food) => !food.isAvailable || food.restaurant.toString() !== restaurantId)) {
    throw createHttpError(400, "One or more items are unavailable at this restaurant");
  }

  const orderItems = foods.map((food) => ({
    foodItem: food._id,
    name: food.name,
    price: food.price,
    quantity: quantities.get(food._id.toString())
  }));
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 500 ? 0 : 40;
  const tax = Math.round(subtotal * 0.05);

  return {
    restaurant: restaurant._id,
    ...(includeRestaurantName && { restaurantName: restaurant.name }),
    items: orderItems,
    deliveryAddress: Object.fromEntries(
      Object.entries(deliveryAddress).map(([field, value]) => [
        field,
        typeof value === "string" ? value.trim() : value
      ])
    ),
    subtotal,
    deliveryFee,
    tax,
    discount: 0,
    total: subtotal + deliveryFee + tax
  };
};

const getRazorpayClient = () => {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw createHttpError(503, "Online payments are not configured. Please use Cash on Delivery.");
  }
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
};

const getCashfreeClient = () => {
  let cashfreeSdk;
  try {
    cashfreeSdk = require("cashfree-pg");
  } catch (error) {
    if (error.code !== "MODULE_NOT_FOUND") throw error;
    console.error("Cashfree SDK is not installed. Run `cd Backend && npm install`.");
    throw createHttpError(503, "Cashfree checkout is not installed yet. Run `cd Backend && npm install` and restart the backend.");
  }

  const { Cashfree, CFEnvironment } = cashfreeSdk;
  if (!Cashfree || !CFEnvironment) {
    console.error("Cashfree SDK exports are unavailable; verify the installed cashfree-pg version");
    throw createHttpError(503, "Cashfree checkout could not be initialized. Check the backend Cashfree SDK installation.");
  }

  const missingVariables = ["CASHFREE_CLIENT_ID", "CASHFREE_CLIENT_SECRET"]
    .filter((key) => !process.env[key]?.trim());
  if (missingVariables.length) {
    missingVariables.forEach((key) => console.error(`Cashfree configuration missing: ${key}`));
    throw createHttpError(503, "Cashfree is not configured. Use Cash on Delivery or configure Cashfree API keys.");
  }

  const environment = (process.env.CASHFREE_ENV || "sandbox").toLowerCase();
  if (environment !== "sandbox" && environment !== "production") {
    console.error("Cashfree configuration invalid: CASHFREE_ENV must be sandbox or production");
    throw createHttpError(500, "Cashfree payment provider is misconfigured");
  }

  const client = new Cashfree(
    environment === "production" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    process.env.CASHFREE_CLIENT_ID,
    process.env.CASHFREE_CLIENT_SECRET
  );
  return { client, environment };
};

const getPaymentOptions = (req, res) => {
  let cashfreeSdkInstalled = true;
  try {
    require.resolve("cashfree-pg");
  } catch (error) {
    if (error.code !== "MODULE_NOT_FOUND") throw error;
    cashfreeSdkInstalled = false;
  }

  const razorpayConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim()
  );
  const cashfreeConfigured = Boolean(
    cashfreeSdkInstalled &&
    process.env.CASHFREE_CLIENT_ID?.trim() &&
    process.env.CASHFREE_CLIENT_SECRET?.trim() &&
    process.env.CASHFREE_RETURN_URL?.trim()
  );

  res.json({
    COD: { enabled: true },
    Online: { enabled: razorpayConfigured },
    PaymentLink: {
      enabled: razorpayConfigured && Boolean(process.env.PAYMENT_LINK_CALLBACK_URL?.trim())
    },
    Cashfree: { enabled: cashfreeConfigured }
  });
};

const getCashfreeReturnUrl = (environment) => {
  const configuredUrl = process.env.CASHFREE_RETURN_URL?.trim();
  if (!configuredUrl) {
    console.error("Cashfree configuration missing: CASHFREE_RETURN_URL");
    throw createHttpError(500, "Cashfree payment provider is misconfigured");
  }

  let returnUrl;
  try {
    returnUrl = new URL(configuredUrl);
  } catch {
    console.error("Cashfree configuration invalid: CASHFREE_RETURN_URL");
    throw createHttpError(500, "Cashfree payment provider is misconfigured");
  }
  if (
    !configuredUrl.includes("{order_id}") ||
    (environment === "production" && returnUrl.protocol !== "https:") ||
    (environment === "sandbox" && !["https:", "http:"].includes(returnUrl.protocol))
  ) {
    console.error("Cashfree configuration invalid: CASHFREE_RETURN_URL");
    throw createHttpError(500, "Cashfree payment provider is misconfigured");
  }
  return configuredUrl;
};

const getCashfreeCustomerPhone = (phone) => {
  if (typeof phone !== "string") throw createHttpError(400, "A valid 10-digit phone number is required for Cashfree");
  const digits = phone.replace(/\D/g, "");
  const localNumber = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  if (!/^[6-9]\d{9}$/.test(localNumber)) {
    throw createHttpError(400, "A valid 10-digit Indian phone number is required for Cashfree");
  }
  return localNumber;
};

const createCashfreeOrder = async (req, res) => {
  let order;
  try {
    const { client, environment } = getCashfreeClient();
    const returnUrl = getCashfreeReturnUrl(environment);
    const { orderId } = req.body || {};

    if (orderId !== undefined) {
      if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({ message: "orderId must be a valid order ID" });
      }
      order = await Order.findOne({ _id: orderId, user: req.user._id });
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.paymentStatus === "paid") {
        return res.status(409).json({ message: "This order has already been paid" });
      }
      if (order.cashfreeOrderId && order.cashfreePaymentSessionId) {
        return res.json({
          orderId: order.cashfreeOrderId,
          paymentSessionId: order.cashfreePaymentSessionId,
          environment
        });
      }
    } else {
      const details = await getOrderDetails(req.body || {});
      order = new Order({
        ...details,
        user: req.user._id,
        paymentMethod: "Cashfree",
        paymentStatus: "pending",
        orderStatus: "Awaiting Payment"
      });
    }

    if (!order) return res.status(400).json({ message: "Provide orderId or valid order details" });
    getCashfreeCustomerPhone(order.deliveryAddress.phone);
    if (order.isNew) await order.save();

    const cashfreeOrderId = `fd_${order._id.toString()}_${crypto.randomBytes(6).toString("hex")}`;
    const response = await client.PGCreateOrder({
      order_id: cashfreeOrderId,
      order_amount: Number(order.total.toFixed(2)),
      order_currency: "INR",
      customer_details: {
        customer_id: `u_${req.user._id.toString()}`,
        customer_name: req.user.name.slice(0, 100),
        customer_email: req.user.email,
        customer_phone: getCashfreeCustomerPhone(order.deliveryAddress.phone)
      },
      order_meta: {
        return_url: returnUrl
      },
      order_note: `Food order ${order._id.toString()}`
    });

    const cashfreeOrder = response.data;
    if (!cashfreeOrder?.order_id || !cashfreeOrder?.payment_session_id) {
      console.error("Cashfree create-order response is missing order_id or payment_session_id");
      return res.status(502).json({
        message: "Cashfree returned an invalid payment response",
        orderId: order._id
      });
    }

    order.paymentMethod = "Cashfree";
    order.paymentStatus = "pending";
    order.orderStatus = "Awaiting Payment";
    order.cashfreeOrderId = cashfreeOrder.order_id;
    order.cashfreePaymentSessionId = cashfreeOrder.payment_session_id;
    order.cashfreeOrderStatus = cashfreeOrder.order_status || "ACTIVE";
    await order.save();

    res.status(201).json({
      orderId: cashfreeOrder.order_id,
      paymentSessionId: cashfreeOrder.payment_session_id,
      environment
    });
  } catch (error) {
    const status = error.status || error.response?.status;
    const providerError = error.response?.data?.message || error.response?.data?.message_text;
    if (status === 401) {
      console.error("Cashfree authentication failed; check CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET");
      return res.status(500).json({
        message: "Cashfree credentials are invalid",
        ...(order && !order.isNew && { orderId: order._id })
      });
    }
    if (status === 400) {
      console.error("Cashfree rejected order request:", providerError || error.message);
      return res.status(400).json({
        message: providerError || "Cashfree rejected the payment request",
        ...(order && !order.isNew && { orderId: order._id })
      });
    }
    if (status) {
      console.error("Cashfree order request failed:", { status, message: providerError || error.message });
    } else {
      console.error("Cashfree order integration failed:", error.message);
    }
    res.status(status && status < 500 ? status : 503).json({
      message: status && status < 500 ? "Could not create the Cashfree payment session" : "Cashfree is temporarily unavailable. Please retry.",
      ...(order && !order.isNew && { orderId: order._id })
    });
  }
};

const verifyCashfreeOrder = async (req, res) => {
  try {
    const { cashfreeOrderId } = req.body || {};
    if (typeof cashfreeOrderId !== "string" || !/^fd_[a-f\d]{24}_[a-f\d]{12}$/i.test(cashfreeOrderId)) {
      return res.status(400).json({ message: "A valid Cashfree order ID is required" });
    }

    const order = await Order.findOne({ cashfreeOrderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.paymentStatus === "paid") return res.json({ paymentStatus: "paid" });

    const { client } = getCashfreeClient();
    const response = await client.PGFetchOrder(cashfreeOrderId);
    const cashfreeOrder = response.data;
    if (
      cashfreeOrder.order_currency !== "INR" ||
      Number(cashfreeOrder.order_amount) !== Number(order.total.toFixed(2))
    ) {
      return res.status(400).json({ message: "Cashfree order amount does not match your order" });
    }
    if (cashfreeOrder.order_status !== "PAID") {
      return res.status(202).json({ paymentStatus: "pending" });
    }

    order.paymentStatus = "paid";
    order.cashfreeOrderStatus = cashfreeOrder.order_status;
    if (order.orderStatus === "Awaiting Payment") order.orderStatus = "Placed";
    await order.save();
    res.json({ paymentStatus: "paid" });
  } catch (error) {
    console.error("Cashfree payment verification failed:", error.response?.status || error.message);
    res.status(error.status || 502).json({
      message: error.status ? error.message : "Could not verify Cashfree payment"
    });
  }
};

const handleCashfreeWebhook = async (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ message: "Webhook body must be raw bytes" });
    }
    const signature = req.get("x-webhook-signature") || "";
    const timestamp = req.get("x-webhook-timestamp") || "";
    if (!signature || !timestamp) {
      return res.status(400).json({ message: "Cashfree webhook signature is missing" });
    }

    const webhookSecret = process.env.CASHFREE_CLIENT_SECRET;
    if (!webhookSecret?.trim()) {
      console.error("Cashfree webhook configuration missing: CASHFREE_CLIENT_SECRET");
      return res.status(500).json({ message: "Cashfree webhook is misconfigured" });
    }
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(timestamp + req.body.toString("utf8"))
      .digest();
    let supplied;
    try {
      supplied = Buffer.from(signature, "base64");
    } catch {
      return res.status(400).json({ message: "Invalid Cashfree webhook signature" });
    }
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
      return res.status(400).json({ message: "Invalid Cashfree webhook signature" });
    }

    const event = JSON.parse(req.body.toString("utf8"));
    if (event.type !== "PAYMENT_SUCCESS_WEBHOOK") return res.status(200).json({ received: true });

    const orderId = event.data?.order?.order_id;
    const payment = event.data?.payment;
    if (!orderId || payment?.payment_status !== "SUCCESS" || !payment?.cf_payment_id) {
      return res.status(200).json({ received: true });
    }

    const order = await Order.findOne({ cashfreeOrderId: orderId, paymentMethod: "Cashfree" });
    if (!order) {
      console.error("Cashfree success webhook received for an unknown order");
      return res.status(200).json({ received: true });
    }
    if (
      event.data.order.order_currency !== "INR" ||
      Number(event.data.order.order_amount) !== Number(order.total.toFixed(2)) ||
      Number(payment.payment_amount) !== Number(order.total.toFixed(2)) ||
      (payment.payment_currency && payment.payment_currency !== "INR")
    ) {
      console.error("Cashfree webhook amount does not match the internal order:", order._id.toString());
      return res.status(400).json({ message: "Cashfree payment amount does not match the order" });
    }

    const paymentId = String(payment.cf_payment_id);
    const updates = {
      paymentStatus: "paid",
      cashfreeOrderStatus: "PAID",
      ...(order.orderStatus === "Awaiting Payment" && { orderStatus: "Placed" })
    };
    const result = await Order.updateOne(
      {
        _id: order._id,
        paymentMethod: "Cashfree",
        paymentStatus: { $ne: "paid" },
        cashfreePaymentIds: { $ne: paymentId }
      },
      { $set: updates, $addToSet: { cashfreePaymentIds: paymentId } }
    );
    if (!result.modifiedCount && order.paymentStatus === "paid" && !order.cashfreePaymentIds.includes(paymentId)) {
      console.error("Cashfree reported an additional successful payment for order:", order._id.toString());
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Cashfree webhook processing failed:", error.message);
    if (error instanceof SyntaxError) return res.status(400).json({ message: "Invalid Cashfree webhook JSON" });
    res.status(500).json({ message: "Failed to process Cashfree webhook" });
  }
};

const getPaymentLinksClient = () => {
  const missingVariables = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]
    .filter((key) => !process.env[key]?.trim());
  if (missingVariables.length) {
    missingVariables.forEach((key) => console.error(`Payment Links configuration missing: ${key}`));
    throw createHttpError(500, "payment provider misconfigured");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

const getPaymentLinkCallbackUrl = () => {
  if (!process.env.PAYMENT_LINK_CALLBACK_URL?.trim()) {
    console.error("Payment Links configuration missing: PAYMENT_LINK_CALLBACK_URL");
    throw createHttpError(500, "payment provider misconfigured");
  }

  let callbackUrl;
  try {
    callbackUrl = new URL(process.env.PAYMENT_LINK_CALLBACK_URL);
  } catch {
    console.error("Payment Links configuration invalid: PAYMENT_LINK_CALLBACK_URL");
    throw createHttpError(500, "payment provider misconfigured");
  }
  if (callbackUrl.protocol !== "https:" && callbackUrl.hostname !== "localhost") {
    console.error("Payment Links configuration invalid: PAYMENT_LINK_CALLBACK_URL");
    throw createHttpError(500, "payment provider misconfigured");
  }
  return callbackUrl.toString();
};

const normalizePaymentLinkContact = (phone) => {
  if (typeof phone !== "string") {
    throw createHttpError(400, "customer.contact must be a valid E.164 number for SMS notifications");
  }
  const trimmedPhone = phone.trim();
  const contact = /^[6-9]\d{9}$/.test(trimmedPhone) ? `+91${trimmedPhone}` : trimmedPhone;
  if (!/^\+[1-9]\d{7,13}$/.test(contact)) {
    throw createHttpError(400, "customer.contact must be a valid E.164 number for SMS notifications");
  }
  return contact;
};

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const createPaymentLinkWithRetry = async (razorpay, options) => {
  for (let attempt = 0; attempt <= 2; attempt += 1) {
    try {
      return await razorpay.paymentLink.create(options);
    } catch (error) {
      const status = error.statusCode || error.status;
      const code = error.error?.code || error.code;
      const description = error.error?.description || error.description || error.message;
      console.error("Razorpay Payment Link request failed:", { status, code, description });

      if (status === 401) {
        console.error("Razorpay authentication failed; check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET");
        throw createHttpError(500, "payment provider misconfigured");
      }
      if (status === 400) {
        throw createHttpError(400, description || "Razorpay rejected the payment link request");
      }

      const retryable =
        (Number.isInteger(status) && status >= 500) ||
        ["ETIMEDOUT", "ECONNRESET", "ECONNABORTED", "EAI_AGAIN", "ENOTFOUND", "ERR_NETWORK"].includes(code);
      if (!retryable || attempt === 2) {
        throw createHttpError(503, "Payment provider is temporarily unavailable. Please retry.");
      }
      await sleep(250 * (2 ** attempt));
    }
  }
};

// @desc    Create and return a Razorpay Payment Link for a customer's order
// @route   POST /api/create-payment-link
const createPaymentLink = async (req, res) => {
  let order;
  try {
    const razorpay = getPaymentLinksClient();
    const callbackUrl = getPaymentLinkCallbackUrl();
    const { orderId } = req.body || {};
    let expireBy = req.body?.expire_by;
    if (expireBy === undefined) expireBy = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    if (!Number.isInteger(expireBy) || expireBy < Math.floor(Date.now() / 1000) + 15 * 60) {
      return res.status(400).json({ message: "expire_by must be at least 15 minutes in the future" });
    }

    if (orderId !== undefined) {
      if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({ message: "orderId must be a valid order ID" });
      }
      order = await Order.findOne({ _id: orderId, user: req.user._id });
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.paymentStatus === "paid") {
        return res.status(409).json({ message: "This order has already been paid" });
      }
      if (!["Placed", "Awaiting Payment"].includes(order.orderStatus)) {
        return res.status(409).json({ message: "This order can no longer be paid" });
      }
      if (order.paymentLinkId && order.paymentLinkShortUrl && !["expired", "cancelled"].includes(order.paymentLinkStatus)) {
        return res.json({
          id: order.paymentLinkId,
          short_url: order.paymentLinkShortUrl,
          status: order.paymentLinkStatus,
          orderId: order._id
        });
      }
    } else {
      const details = await getOrderDetails(req.body || {});
      order = new Order({
        ...details,
        user: req.user._id,
        paymentMethod: "Online",
        paymentStatus: "pending",
        orderStatus: "Awaiting Payment"
      });
    }

    if (!order) return res.status(400).json({ message: "Provide orderId or valid order details" });

    const amount = Math.round(order.total * 100);
    if (!Number.isInteger(amount) || amount < 100) {
      return res.status(400).json({ message: "amount must be at least 100 in the smallest currency unit" });
    }
    const contact = normalizePaymentLinkContact(order.deliveryAddress.phone);
    if (order.isNew) await order.save();
    const currency = "INR";
    const referenceId = order._id.toString();
    const paymentLink = await createPaymentLinkWithRetry(razorpay, {
      amount,
      currency,
      accept_partial: false,
      expire_by: expireBy,
      description: `Payment for order #${referenceId}`,
      customer: {
        name: req.user.name,
        email: req.user.email,
        contact
      },
      notify: { sms: true, email: true },
      reminder_enable: true,
      notes: { order_id: referenceId },
      callback_url: callbackUrl,
      callback_method: "get",
      reference_id: referenceId
    });

    if (!paymentLink?.id || !paymentLink?.short_url) {
      console.error("Razorpay Payment Link response missing id or short_url");
      return res.status(502).json({
        message: "Payment provider returned an invalid response",
        orderId: order._id
      });
    }

    const linkStatus = paymentLink.status || "created";
    order.paymentMethod = "Online";
    order.paymentStatus = "pending";
    order.orderStatus = "Awaiting Payment";
    order.paymentLinkId = paymentLink.id;
    order.paymentLinkShortUrl = paymentLink.short_url;
    order.paymentLinkStatus = linkStatus;
    order.paymentLinkReferenceId = paymentLink.reference_id || referenceId;
    order.paymentLinkAmount = paymentLink.amount ?? amount;
    order.paymentLinkCurrency = paymentLink.currency || currency;
    await order.save();

    res.status(201).json({
      id: paymentLink.id,
      short_url: paymentLink.short_url,
      status: linkStatus,
      orderId: order._id
    });
  } catch (error) {
    if (order && !order.isNew) {
      console.error("Payment Link creation failed for order:", order._id.toString());
    }
    if (error.status) {
      return res.status(error.status).json({
        message: error.message,
        ...(order && !order.isNew && { orderId: order._id })
      });
    }
    console.error("Payment Link integration failure:", error.message);
    res.status(500).json({
      message: "Failed to create payment link",
      ...(order && !order.isNew && { orderId: order._id })
    });
  }
};

// @desc    Read a Razorpay Payment Link status
// @route   GET /api/payment-link/:id
const getPaymentLinkStatus = async (req, res) => {
  try {
    if (!req.params.id || !req.params.id.startsWith("plink_")) {
      return res.status(400).json({ message: "A valid payment link ID is required" });
    }
    const orderQuery = { paymentLinkId: req.params.id };
    if (req.user.role !== "admin" && req.user.role !== "restaurant_owner") {
      orderQuery.user = req.user._id;
    }
    const order = await Order.findOne(orderQuery);
    if (!order) return res.status(404).json({ message: "Payment link not found" });

    const razorpay = getPaymentLinksClient();
    const paymentLink = await razorpay.paymentLink.fetch(req.params.id);
    res.json({
      status: paymentLink.status,
      amount_paid: paymentLink.amount_paid,
      payments: paymentLink.payments || []
    });
  } catch (error) {
    console.error("Payment Link status lookup failed:", error.message);
    res.status(error.status || 502).json({ message: error.status ? error.message : "Failed to fetch payment link status" });
  }
};

// @desc    Verify and process Payment Link webhook events
// @route   POST /api/razorpay-webhook
const handlePaymentLinkWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      console.error("Payment Links configuration missing: RAZORPAY_WEBHOOK_SECRET");
      return res.status(500).json({ message: "payment provider misconfigured" });
    }
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ message: "Webhook body must be raw bytes" });
    }

    const signature = req.get("x-razorpay-signature") || "";
    if (!/^[a-f\d]{64}$/i.test(signature)) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }
    const expected = crypto.createHmac("sha256", webhookSecret).update(req.body).digest();
    const supplied = Buffer.from(signature, "hex");
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const event = JSON.parse(req.body.toString("utf8"));
    const supportedEvents = [
      "payment_link.paid",
      "payment_link.partially_paid",
      "payment_link.expired",
      "payment_link.cancelled"
    ];
    if (!supportedEvents.includes(event.event)) return res.status(200).json({ received: true });

    const paymentLink = event.payload?.payment_link?.entity;
    if (!paymentLink?.id) return res.status(400).json({ message: "Payment Link details are missing" });
    const referenceId = paymentLink.notes?.order_id;
    const orderMatches = [{ paymentLinkId: paymentLink.id }];
    if (referenceId && mongoose.isValidObjectId(referenceId)) orderMatches.push({ _id: referenceId });
    const order = await Order.findOne({ $or: orderMatches });
    if (!order) {
      console.error("Payment Link webhook received for an unknown internal order");
      return res.status(200).json({ received: true });
    }
    if (order.paymentLinkId && order.paymentLinkId !== paymentLink.id) {
      console.error("Payment Link webhook reference does not match its internal order");
      return res.status(200).json({ received: true });
    }

    if (event.event === "payment_link.paid") {
      if (
        paymentLink.currency !== "INR" ||
        !Number.isInteger(paymentLink.amount_paid) ||
        paymentLink.amount_paid < Math.round(order.total * 100)
      ) {
        return res.status(400).json({ message: "Paid amount does not match the order" });
      }
    }

    const eventId = req.get("x-razorpay-event-id") || crypto.createHash("sha256").update(req.body).digest("hex");
    const eventKey = `${eventId}:${event.event}`;
    const updates = {
      paymentLinkId: paymentLink.id,
      paymentLinkStatus: paymentLink.status || event.event.replace("payment_link.", ""),
      paymentLinkReferenceId: paymentLink.reference_id || order._id.toString(),
      paymentLinkAmount: paymentLink.amount || Math.round(order.total * 100),
      paymentLinkCurrency: paymentLink.currency || "INR",
      ...(paymentLink.short_url && { paymentLinkShortUrl: paymentLink.short_url })
    };
    if (event.event === "payment_link.paid") {
      updates.paymentStatus = "paid";
      if (order.orderStatus === "Awaiting Payment") updates.orderStatus = "Placed";
    } else if (["payment_link.expired", "payment_link.cancelled"].includes(event.event) && order.paymentStatus !== "paid") {
      updates.orderStatus = "Cancelled";
    }

    const updateFilter = { _id: order._id, paymentLinkWebhookEventIds: { $ne: eventKey } };
    if (["payment_link.expired", "payment_link.cancelled"].includes(event.event)) {
      updateFilter.paymentStatus = { $ne: "paid" };
    }
    await Order.updateOne(
      updateFilter,
      { $set: updates, $addToSet: { paymentLinkWebhookEventIds: eventKey } }
    );
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Payment Link webhook processing failed:", error.message);
    if (error instanceof SyntaxError) return res.status(400).json({ message: "Invalid webhook JSON" });
    res.status(500).json({ message: "Failed to process webhook" });
  }
};

// @desc    Create a cash-on-delivery order
// @route   POST /api/orders
const createOrder = async (req, res) => {
  try {
    if (req.body?.paymentMethod && req.body.paymentMethod !== "COD") {
      return res.status(400).json({ message: "Use the online checkout to pay electronically" });
    }

    const details = await getOrderDetails(req.body || {});
    const order = await Order.create({
      ...details,
      user: req.user._id,
      paymentMethod: "COD",
      paymentStatus: "pending",
      orderStatus: "Placed"
    });
    res.status(201).json(order);
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(error.status || 500).json({ message: error.status ? error.message : "Failed to create order" });
  }
};

// @desc    Create a Razorpay order and save an awaiting-payment order
// @route   POST /api/orders/razorpay
const createRazorpayOrder = async (req, res) => {
  try {
    const razorpay = getRazorpayClient();
    const { restaurantName, ...details } = await getOrderDetails(req.body || {}, true);
    const receipt = `fd_${crypto.randomBytes(16).toString("hex")}`;
    const gatewayOrder = await razorpay.orders.create({
      amount: Math.round(details.total * 100),
      currency: "INR",
      receipt,
      notes: { userId: req.user._id.toString() }
    });

    const order = await Order.create({
      ...details,
      user: req.user._id,
      paymentMethod: "Online",
      paymentStatus: "pending",
      orderStatus: "Awaiting Payment",
      razorpayOrderId: gatewayOrder.id
    });

    res.status(201).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: gatewayOrder.amount,
      currency: gatewayOrder.currency,
      razorpayOrderId: gatewayOrder.id,
      orderId: order._id,
      restaurantName,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: details.deliveryAddress.phone
    });
  } catch (error) {
    console.error("Online order creation failed:", error);
    res.status(error.status || 500).json({ message: error.status ? error.message : "Failed to start online payment" });
  }
};

// @desc    Verify the Razorpay signature and confirm the order
// @route   POST /api/orders/razorpay/verify
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (
      !orderId ||
      !mongoose.isValidObjectId(orderId) ||
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      return res.status(400).json({ message: "Payment verification details are incomplete" });
    }

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order || order.razorpayOrderId !== razorpay_order_id) {
      return res.status(404).json({ message: "Order or payment could not be found" });
    }

    const razorpay = getRazorpayClient();
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    const supplied = Buffer.from(razorpay_signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
      return res.status(400).json({ message: "Payment signature verification failed" });
    }

    if (order.paymentStatus === "paid" && order.razorpayPaymentId === razorpay_payment_id) {
      return res.json(order);
    }
    if (order.paymentStatus !== "pending") {
      return res.status(409).json({ message: "This order can no longer be paid" });
    }

    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (
      payment.order_id !== razorpay_order_id ||
      payment.amount !== Math.round(order.total * 100) ||
      payment.currency !== "INR" ||
      payment.status !== "captured"
    ) {
      return res.status(400).json({ message: "Payment has not been captured for this order" });
    }

    order.paymentStatus = "paid";
    order.razorpayPaymentId = razorpay_payment_id;
    order.orderStatus = "Placed";
    await order.save();
    res.json(order);
  } catch (error) {
    console.error("Online payment verification failed:", error);
    res.status(error.status || 500).json({ message: error.status ? error.message : "Failed to verify payment" });
  }
};

// @desc    Confirm captured payments even if the browser closes before verification
// @route   POST /api/orders/razorpay/webhook
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(503).json({ message: "Payment webhook is not configured" });
    }
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ message: "Invalid webhook body" });
    }

    const signature = req.get("x-razorpay-signature") || "";
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(req.body).digest("hex");
    const supplied = Buffer.from(signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
      return res.status(400).json({ message: "Webhook signature verification failed" });
    }

    const event = JSON.parse(req.body.toString("utf8"));
    if (event.event !== "payment.captured") return res.json({ received: true });

    const payment = event.payload?.payment?.entity;
    if (!payment?.order_id || !payment.id) {
      return res.status(400).json({ message: "Captured payment details are missing" });
    }

    const order = await Order.findOne({ razorpayOrderId: payment.order_id });
    if (!order) return res.status(404).json({ message: "Matching order not found" });
    if (
      payment.status !== "captured" ||
      payment.amount !== Math.round(order.total * 100) ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({ message: "Captured payment does not match the order" });
    }

    if (order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.razorpayPaymentId = payment.id;
      order.orderStatus = "Placed";
      await order.save();
    } else if (order.razorpayPaymentId !== payment.id) {
      console.error(`Multiple captured payments reported for order ${order._id}`);
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook processing failed:", error);
    res.status(500).json({ message: "Failed to process payment webhook" });
  }
};

// @desc    Get orders for logged in user
// @route   GET /api/orders/my-orders
const getMyOrders = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    const orders = await Order.find({ user: req.user._id })
      .populate("restaurant", "name image address deliveryTime")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const orderQuery = { _id: req.params.id };
    if (req.user.role !== "admin" && req.user.role !== "restaurant_owner") {
      orderQuery.user = req.user._id;
    }

    const order = await Order.findOne(orderQuery)
      .populate("user", "name email phone")
      .populate("restaurant", "name image address phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status (Admin / Restaurant Owner)
// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body || {};
    const allowedStatuses = ["Placed", "Accepted", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];
    if (typeof orderStatus !== "string" || !allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const filter = { _id: req.params.id };
    if (orderStatus !== "Cancelled") {
      filter.orderStatus = { $ne: "Cancelled" };
      filter.$or = [{ paymentMethod: "COD" }, { paymentStatus: "paid" }];
    }

    const updatedOrder = await Order.findOneAndUpdate(
      filter,
      { $set: { orderStatus } },
      { new: true, runValidators: true }
    );
    if (!updatedOrder) {
      const order = await Order.findById(req.params.id).select("paymentMethod paymentStatus orderStatus");
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (order.paymentMethod !== "COD" && order.paymentStatus !== "paid" && orderStatus !== "Cancelled") {
        return res.status(409).json({ message: "This order is unpaid. Cancel it or wait for payment confirmation before processing." });
      }
      if (order.orderStatus === "Cancelled" && orderStatus !== "Cancelled") {
        return res.status(409).json({ message: "This order is cancelled and cannot move to another status." });
      }
      return res.status(409).json({ message: "The order status changed elsewhere. Refresh the order and try again." });
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (Admin view)
// @route   GET /api/orders/admin/all
const getAllOrdersForAdmin = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    const orders = await Order.find({})
      .populate("user", "name email phone")
      .populate("restaurant", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getPaymentOptions,
  createCashfreeOrder,
  verifyCashfreeOrder,
  handleCashfreeWebhook,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createPaymentLink,
  getPaymentLinkStatus,
  handlePaymentLinkWebhook,
  handleRazorpayWebhook,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrdersForAdmin
};
