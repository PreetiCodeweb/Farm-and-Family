require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Auto-seed on first run so `npm start` works immediately with no extra steps
const DB_FILE = path.join(__dirname, "data", "db.json");
if (!fs.existsSync(DB_FILE)) {
  console.log("No database found — seeding initial data...");
  require("./data/seed.js");
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", brand: "Farm & Family", time: new Date().toISOString() });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/farmers", require("./routes/farmers"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/wholesale", require("./routes/wholesale"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/newsletter", require("./routes/newsletter"));

// Serve the static frontend so the whole platform can run from one process
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_DIR));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🌱 Farm & Family API running at http://localhost:${PORT}`);
});
