const express = require("express");
const { nanoid } = require("nanoid");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const STAGES = ["placed", "confirmed", "packed", "out_for_delivery", "delivered"];

// POST /api/orders  { items: [{productId, quantity}], deliveryAddress, paymentMethod }
router.post("/", requireAuth, (req, res) => {
  const { items, deliveryAddress, paymentMethod = "cod" } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: "Order must contain at least one item" });
  if (!deliveryAddress) return res.status(400).json({ error: "deliveryAddress is required" });

  const lineItems = [];
  let subtotal = 0;
  for (const it of items) {
    const product = db.findById("products", it.productId);
    if (!product) return res.status(404).json({ error: `Product ${it.productId} not found` });
    if (product.stock < it.quantity) {
      return res.status(409).json({ error: `Insufficient stock for ${product.name}` });
    }
    lineItems.push({ productId: product.id, name: product.name, price: product.price, quantity: it.quantity });
    subtotal += product.price * it.quantity;
    db.update("products", product.id, { stock: product.stock - it.quantity });
  }

  const deliveryFee = subtotal >= 500 ? 0 : 40;
  const order = {
    id: "FF" + nanoid(8).toUpperCase(),
    userId: req.user.id,
    items: lineItems,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    deliveryAddress,
    paymentMethod,
    status: "placed",
    statusHistory: [{ status: "placed", at: new Date().toISOString() }],
    placedAt: new Date().toISOString(),
    estimatedDelivery: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      return d.toISOString().slice(0, 10);
    })()
  };
  db.insert("orders", order);

  // clear the user's cart after checkout
  const data = db.load();
  data.carts[req.user.id] = [];
  db.save(data);

  res.status(201).json(order);
});

// GET /api/orders/mine
router.get("/mine", requireAuth, (req, res) => {
  const orders = db.all("orders").filter((o) => o.userId === req.user.id);
  res.json(orders.sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1)));
});

// GET /api/orders/:id
router.get("/:id", requireAuth, (req, res) => {
  const order = db.findById("orders", req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.userId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Not your order" });
  }
  res.json(order);
});

// PATCH /api/orders/:id/status   (admin/delivery partner use)
router.patch("/:id/status", requireAuth, (req, res) => {
  if (!["admin", "delivery"].includes(req.user.role)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  const { status } = req.body;
  if (!STAGES.includes(status)) return res.status(400).json({ error: `status must be one of ${STAGES.join(", ")}` });

  const order = db.findById("orders", req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const statusHistory = [...order.statusHistory, { status, at: new Date().toISOString() }];
  const updated = db.update("orders", order.id, { status, statusHistory });
  res.json(updated);
});

module.exports = router;
