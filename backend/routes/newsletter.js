const express = require("express");
const { nanoid } = require("nanoid");
const db = require("../db");
const router = express.Router();

// POST /api/newsletter/subscribe  { email, interests: ["fruits","spices"] }
router.post("/subscribe", (req, res) => {
  const { email, interests = [] } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  const subscribers = db.all("newsletterSubscribers");
  if (subscribers.find((s) => s.email.toLowerCase() === email.toLowerCase())) {
    return res.json({ message: "You're already subscribed." });
  }
  db.insert("newsletterSubscribers", { id: nanoid(8), email, interests, subscribedAt: new Date().toISOString() });
  res.status(201).json({ message: "Subscribed! We'll email you when your favourite harvests are ready." });
});

module.exports = router;
