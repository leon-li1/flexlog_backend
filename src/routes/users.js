const auth = require("../middleware/auth");
const { User, validate, validateUserUpdate } = require("../models/user");
const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");

router.get("/all", async (req, res) => {
  const users = await User.find();
  res.send(users);
});

router.get("/me", auth, async (req, res) => {
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

  const token = user.generateAuthToken();
  res
    .header("x-auth-token", token)
    .send(_.pick(user, ["name", "email", "id", "isAdmin"]));
});

router.patch("/update", auth, async (req, res) => {
  const { error } = validateUserUpdate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = _.pick(req.body, ["name", "email", "password"]);
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
  const updatedUser = await User.findByIdAndUpdate(req.user._id, user, {
    new: true,
  });

  if (!updatedUser)
    return res.status(404).send("The account was not found in the db");

  res.send(_.pick(updatedUser, "name", "email", "id", "isAdmin"));
});

module.exports = router;
