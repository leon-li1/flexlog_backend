const { User, validate, validateUserUpdate } = require("../models/user");
const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser")();
const auth = require("../middleware/auth");
const validateUser = require("../middleware/validateUser");

router.get("/all", async (req, res) => {
  const users = await User.find();
  res.send(users);
});

router.get("/me", [cookieParser, auth], async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.post("/add", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user)
    return res.status(400).send("Email is already registered with an account");

  user = new User(_.pick(req.body, ["name", "email", "password", "isAdmin"]));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  user.save();

  res.send(_.pick(user, ["name", "email", "id", "isAdmin"]));
});

router.patch(
  "/update",
  [cookieParser, auth, validateUser],
  async (req, res) => {
    const { error } = validateUserUpdate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = _.pick(req.body, ["name", "email", "password", "units"]);
    if (req.body.password && user.password !== "TEST") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    } else {
      delete user.password;
    }
    const updatedUser = await User.findByIdAndUpdate(req.user._id, user, {
      new: true,
    });

    res.send(updatedUser);
  }
);

module.exports = router;
