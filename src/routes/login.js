const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const validate = (req) => {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(4).max(255).required(),
  });
  return schema.validate(req);
};

// this returns the jwt of a valid user
router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Invalid email or password");

  const isCorrectPassword = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isCorrectPassword)
    return res.status(400).send("Invalid email or password");

  const token = user.generateAuthToken();
  res.cookie("token", token, { httpOnly: true });
  res.send({ token });
});

module.exports = router;
