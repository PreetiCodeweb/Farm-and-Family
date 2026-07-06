const express = require("express");
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();

// GET /api/farmers
router.get("/", (req, res) => {
  res.json(db.all("farmers"));
});

// GET /api/farmers/:id  (profile + their products)
router.get("/:id", (req, res) => {
  const farmer = db.findById("farmers", req.params.id);
  if (!farmer) return res.status(404).json({ error: "Farmer not found" });
  const products = db.all("products").filter((p) => p.farmerId === farmer.id);
  res.json({ ...farmer, products });
});

// GET /api/farmers/:id/dashboard  (self-service dashboard: orders + earnings, farmer-only)
router.get("/:id/dashboard", requireAuth, requireRole("farmer", "admin"), (req, res) => {
  const farmer = db.findById("farmers", req.params.id);
  if (!farmer) return res.status(404).json({ error: "Farmer not found" });
  const products = db.all("products").filter((p) => p.farmerId === farmer.id);
  const productIds = products.map((p) => p.id);
  const orders = db.all("orders").filter((o) => o.items.some((i) => productIds.includes(i.productId)));

  const earnings = orders.reduce((sum, o) => {
    const mine = o.items.filter((i) => productIds.includes(i.productId));
    return sum + mine.reduce((s, i) => s + i.price * i.quantity * 0.85 /* 15% platform commission */, 0);
  }, 0);

  res.json({
    farmer,
    products,
    totalOrders: orders.length,
    estimatedEarnings: Math.round(earnings),
    lowStockProducts: products.filter((p) => p.stock < 15)
  });
});

module.exports = router;
