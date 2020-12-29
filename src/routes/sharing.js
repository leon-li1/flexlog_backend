const express = require("express");
const router = express.Router();
const _ = require("lodash");
const { Share, validate } = require("../models/share");
const { User } = require("../models/user");
const cookieParser = require("cookie-parser")();
const auth = require("../middleware/auth");
const validateUser = require("../middleware/validateUser");

router.get("/:id", async (req, res) => {
  const share = await Share.findById(req.params.id).populate({
    path: "workouts",
    populate: { path: "exercises" },
  });

  await User.findByIdAndUpdate(share.owner, { $inc: { points: 10 } });

  res.send(share.workouts);
});

router.post("/create", [cookieParser, auth, validateUser], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const share = await new Share(_.pick(req.body, ["owner", "workouts"])).save();
  res.send(share);
});

module.exports = router;
