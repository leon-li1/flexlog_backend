const Joi = require("joi");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 15,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 1024,
  },
  isAdmin: { type: Boolean, default: false },
  points: {
    type: Number,
    default: 50,
  },
  numWorkouts: {
    type: Number,
    default: 0,
  },
  workouts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workout",
    },
  ],
  stars: {
    type: Number,
    default: 0,
  },
  nextStar: {
    type: Number,
    default: 20,
  },
  units: {
    type: String,
    enum: ["Imperial", "Metric"],
    default: "Imperial",
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
});

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { _id: this._id, isAdmin: this.isAdmin },
    process.env.JWT_PRIVATE_KEY
  );
};

const User = mongoose.model("User", userSchema);

const validateUser = (user) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(15).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(4).max(255).required(),
    passwordConfirm: Joi.ref("password"),
  });
  return schema.validate(user);
};

const validateUserUpdate = (user) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(15),
    email: Joi.string().min(5).max(255).email(),
    password: Joi.string().min(4).max(255),
    passwordConfirm: Joi.ref("password"),
    units: Joi.valid("Metric", "Imperial"),
  });
  return schema.validate(user);
};

exports.User = User;
exports.validate = validateUser;
exports.validateUserUpdate = validateUserUpdate;
