const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", (req, res) => {
  const settings = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  res.json(settings);
});

router.put("/", (req, res) => {
  const current = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  const { logo, app_name } = req.body;

  db.prepare("UPDATE settings SET logo = ?, app_name = ? WHERE id = 1").run(
    logo !== undefined ? logo : current.logo,
    app_name !== undefined && app_name.trim() ? app_name.trim() : current.app_name
  );

  res.json(db.prepare("SELECT * FROM settings WHERE id = 1").get());
});

module.exports = router;
