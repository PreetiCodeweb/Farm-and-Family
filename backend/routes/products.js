const express = require("express");
const { nanoid } = require("nanoid");
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

function attachFarmerAndCategory(product) {
  const farmer = db.findById("farmers", product.farmerId);
  const category = db.findById("categories", product.categoryId);
  return {
    ...product,
    farmer: farmer ? { id: farmer.id, name: farmer.name, village: farmer.village, state: farmer.state, rating: farmer.rating } : null,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null
  };
}

// GET /api/products?category=&q=&farmFreshToday=&sort=
router.get("/", (req, res) => {
  const { category, q, farmFreshToday, minPrice, maxPrice, sort } = req.query;
  let results = db.all("products");

  if (category) {
    const cat = db.all("categories").find((c) => c.slug === category || c.id === category);
    if (cat) results = results.filter((p) => p.categoryId === cat.id);
  }
  if (q) {
    const needle = q.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.shortDescription.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle)
    );
  }
  if (farmFreshToday === "true") {
    results = results.filter((p) => p.farmFreshToday);
  }
  if (minPrice) results = results.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) results = results.filter((p) => p.price <= Number(maxPrice));

  if (sort === "price_asc") results = [...results].sort((a, b) => a.price - b.price);
  if (sort === "price_desc") results = [...results].sort((a, b) => b.price - a.price);
  if (sort === "rating") results = [...results].sort((a, b) => b.rating - a.rating);
  if (sort === "newest") results = [...results].sort((a, b) => (a.harvestedOn < b.harvestedOn ? 1 : -1));

  res.json({ count: results.length, products: results.map(attachFarmerAndCategory) });
});

// GET /api/products/farm-fresh-today
router.get("/farm-fresh-today", (req, res) => {
  const results = db.all("products").filter((p) => p.farmFreshToday);
  res.json({ count: results.length, products: results.map(attachFarmerAndCategory) });
});

// GET /api/products/:id
router.get("/:id", (req, res) => {
  const product = db.findById("products", req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  const reviews = db.all("reviews").filter((r) => r.productId === product.id);
  res.json({ ...attachFarmerAndCategory(product), reviews });
});

// GET /api/products/:id/trace  -> full farm-to-table traceability (what the QR code resolves to)
router.get("/:id/trace", (req, res) => {
  const product = db.findById("products", req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  const farmer = db.findById("farmers", product.farmerId);
  const events = (db.load().traceEvents || {})[req.params.id] || [];
  res.json({
    product: { id: product.id, name: product.name, harvestedOn: product.harvestedOn, images: product.images },
    farmer,
    cultivationMethod: product.cultivationMethod,
    qualityCertifications: product.qualityCertifications,
    timeline: events
  });
});

// POST /api/products/:id/reviews  (authenticated customers)
router.post("/:id/reviews", requireAuth, (req, res) => {
  const product = db.findById("products", req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "rating must be 1-5" });

  const review = {
    id: nanoid(8),
    productId: product.id,
    user: req.user.name,
    rating,
    comment: comment || "",
    date: new Date().toISOString().slice(0, 10)
  };
  db.insert("reviews", review);
  res.status(201).json(review);
});

module.exports = router;
