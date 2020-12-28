const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  res.clearCookie("token");
  return res.send("Token cookie cleared!");
});

module.exports = router;
