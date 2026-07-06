const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/", (req, res) => {
  res.json(db.all("categories"));
});

module.exports = router;
