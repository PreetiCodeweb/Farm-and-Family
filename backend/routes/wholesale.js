const express = require("express");
const { nanoid } = require("nanoid");
const db = require("../db");
const router = express.Router();

// GET /api/wholesale/pricing/:productId  — bulk price tiers (illustrative discount ladder)
router.get("/pricing/:productId", (req, res) => {
  const product = db.findById("products", req.params.productId);
  if (!product) return res.status(404).json({ error: "Product not found" });
  const tiers = [
    { minUnits: 10, discountPercent: 5, pricePerUnit: Math.round(product.price * 0.95) },
    { minUnits: 50, discountPercent: 12, pricePerUnit: Math.round(product.price * 0.88) },
    { minUnits: 200, discountPercent: 20, pricePerUnit: Math.round(product.price * 0.8) }
  ];
  res.json({ productId: product.id, unit: product.unit, retailPrice: product.price, tiers });
});

// POST /api/wholesale/inquiry  { businessName, contactName, email, phone, businessType, monthlyVolumeEstimate, message }
router.post("/inquiry", (req, res) => {
  const { businessName, contactName, email, phone, businessType, monthlyVolumeEstimate, message } = req.body;
  if (!businessName || !contactName || !email || !phone) {
    return res.status(400).json({ error: "businessName, contactName, email and phone are required" });
  }
  const inquiry = {
    id: nanoid(10),
    businessName,
    contactName,
    email,
    phone,
    businessType: businessType || "other",
    monthlyVolumeEstimate: monthlyVolumeEstimate || null,
    message: message || "",
    status: "new",
    createdAt: new Date().toISOString()
  };
  db.insert("wholesaleInquiries", inquiry);
  res.status(201).json({ message: "Thanks — our wholesale team will reach out within 1 business day.", inquiry });
});

// GET /api/wholesale/inquiries  (admin)
router.get("/inquiries", (req, res) => {
  res.json(db.all("wholesaleInquiries"));
});

module.exports = router;
