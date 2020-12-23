const auth = require("../middleware/auth");
const validateUser = require("../middleware/validateUser");
const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const Joi = require("joi");

const validate = (req) => {
  const schema = Joi.object({
    increment: Joi.number().min(1).required(),
  });
  return schema.validate(req);
};

const addStar = (id) => {
  return User.findByIdAndUpdate(
    id,
    {
      $inc: { points: 50, stars: 1 },
      $mul: { nextStar: 2 },
    },
    { new: true }
  );
};

router.patch("/add", [auth, validateUser], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $inc: { points: req.body.increment } },
    { new: true }
  );
  res.send(user);
});

router.patch("/addStar", [auth, validateUser], async (req, res) => {
  const user = await addStar(req.user._id);
  res.send(user);
});

module.exports = router;
module.exports.addStar = addStar;
