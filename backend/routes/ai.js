const express = require("express");
const db = require("../db");
const router = express.Router();

// A small keyword->tag map so search/recommendations work out of the box with
// zero external dependencies. If ANTHROPIC_API_KEY is set, /assistant will
// instead call the real Claude API for a much richer natural-language reply.
const INTENT_TAGS = {
  protein: ["pulses", "grains"],
  breakfast: ["grains", "honey", "oils-honey"],
  immune: ["spices", "turmeric", "honey"],
  cold: ["turmeric", "honey", "spices"],
  soup: ["vegetables", "spices"],
  weight: ["vegetables", "fruits"],
  sweet: ["sweets", "honey"],
  gift: ["gifts"],
  diabetic: ["vegetables", "spices"],
  skin: ["fruits", "oils-honey"]
};

function keywordSearch(query) {
  const q = query.toLowerCase();
  const matchedSlugs = new Set();
  for (const [keyword, slugs] of Object.entries(INTENT_TAGS)) {
    if (q.includes(keyword)) slugs.forEach((s) => matchedSlugs.add(s));
  }
  const categories = db.all("categories").filter((c) => matchedSlugs.has(c.slug));
  const categoryIds = categories.map((c) => c.id);
  let products = db.all("products");
  if (categoryIds.length) {
    products = products.filter((p) => categoryIds.includes(p.categoryId));
  } else {
    // fall back to plain text match across name/description
    products = products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q)
    );
  }
  return products;
}

// POST /api/ai/search  { query: "high-protein breakfast" }
router.post("/search", (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "query is required" });
  const products = keywordSearch(query);
  res.json({ query, count: products.length, products });
});

// POST /api/ai/nutrition-assistant  { query, dietaryPreferences }
// Uses the real Anthropic API if ANTHROPIC_API_KEY is configured; otherwise
// falls back to a transparent rule-based recommendation so the endpoint
// always works in local/demo environments.
router.post("/nutrition-assistant", async (req, res) => {
  const { query, dietaryPreferences = [] } = req.body;
  if (!query) return res.status(400).json({ error: "query is required" });

  const matchedProducts = keywordSearch(query).slice(0, 5);

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({
      mode: "rule-based",
      note: "Set ANTHROPIC_API_KEY in the environment to enable full conversational answers from Claude.",
      suggestion:
        matchedProducts.length > 0
          ? `Based on "${query}", here are farm-fresh picks that fit: ${matchedProducts.map((p) => p.name).join(", ")}.`
          : `We couldn't find a strong match for "${query}" yet — try mentioning a goal like "high protein", "immune boosting", or "for soup".`,
      products: matchedProducts
    });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: `You are the nutrition assistant for Farm & Family, an Indian farm-to-consumer grocery brand. A customer asked: "${query}". Dietary preferences: ${dietaryPreferences.join(", ") || "none specified"}. Here is our current catalog subset that might be relevant: ${JSON.stringify(
              matchedProducts.map((p) => ({ name: p.name, category: p.categoryId, shortDescription: p.shortDescription }))
            )}. Recommend 2-4 relevant products from this list (or say if none fit) and explain briefly why, in a warm, concise tone. Keep it under 120 words.`
          }
        ]
      })
    });
    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || "").join("\n");
    res.json({ mode: "claude", suggestion: text, products: matchedProducts });
  } catch (err) {
    res.status(502).json({ error: "AI assistant temporarily unavailable", details: err.message });
  }
});

// GET /api/ai/recommendations/:userId  — simple collaborative-ish suggestion based on past order categories
router.get("/recommendations/:userId", (req, res) => {
  const orders = db.all("orders").filter((o) => o.userId === req.params.userId);
  const products = db.all("products");

  if (!orders.length) {
    // cold start: recommend top-rated + farm-fresh-today
    const fallback = [...products].sort((a, b) => b.rating - a.rating).slice(0, 6);
    return res.json({ basis: "top-rated (no order history yet)", products: fallback });
  }

  const purchasedCategoryIds = new Set();
  const purchasedProductIds = new Set();
  orders.forEach((o) =>
    o.items.forEach((i) => {
      purchasedProductIds.add(i.productId);
      const p = db.findById("products", i.productId);
      if (p) purchasedCategoryIds.add(p.categoryId);
    })
  );

  const recommended = products
    .filter((p) => purchasedCategoryIds.has(p.categoryId) && !purchasedProductIds.has(p.id))
    .sort((a, b) => b.rating - a.rating);

  res.json({ basis: "based on your past categories", products: recommended.slice(0, 6) });
});

module.exports = router;
