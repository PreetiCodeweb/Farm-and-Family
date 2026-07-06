const express = require("express");
const db = require("../db");
const router = express.Router();

function getCart(ownerId) {
  const data = db.load();
  return data.carts[ownerId] || [];
}

function setCart(ownerId, items) {
  const data = db.load();
  data.carts[ownerId] = items;
  db.save(data);
  return items;
}

function withProductDetails(items) {
  return items.map((item) => {
    const product = db.findById("products", item.productId);
    return {
      ...item,
      product: product
        ? { id: product.id, name: product.name, price: product.price, unit: product.unit, images: product.images, stock: product.stock }
        : null,
      lineTotal: product ? product.price * item.quantity : 0
    };
  });
}

// GET /api/cart/:ownerId  (ownerId = user id or a guest session id from the client)
router.get("/:ownerId", (req, res) => {
  const items = getCart(req.params.ownerId);
  const detailed = withProductDetails(items);
  const total = detailed.reduce((sum, i) => sum + i.lineTotal, 0);
  res.json({ items: detailed, total });
});

// POST /api/cart/:ownerId  { productId, quantity }
router.post("/:ownerId", (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = db.findById("products", productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const items = getCart(req.params.ownerId);
  const existing = items.find((i) => i.productId === productId);
  if (existing) existing.quantity += Number(quantity);
  else items.push({ productId, quantity: Number(quantity) });

  setCart(req.params.ownerId, items);
  res.status(201).json({ items: withProductDetails(items) });
});

// PUT /api/cart/:ownerId/:productId  { quantity }
router.put("/:ownerId/:productId", (req, res) => {
  const { quantity } = req.body;
  let items = getCart(req.params.ownerId);
  items = items.map((i) => (i.productId === req.params.productId ? { ...i, quantity: Number(quantity) } : i));
  setCart(req.params.ownerId, items);
  res.json({ items: withProductDetails(items) });
});

// DELETE /api/cart/:ownerId/:productId
router.delete("/:ownerId/:productId", (req, res) => {
  let items = getCart(req.params.ownerId);
  items = items.filter((i) => i.productId !== req.params.productId);
  setCart(req.params.ownerId, items);
  res.json({ items: withProductDetails(items) });
});

module.exports = router;
