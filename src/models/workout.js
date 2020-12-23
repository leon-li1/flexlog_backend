const Joi = require("joi");
const mongoose = require("mongoose");
const moment = require("moment");
Joi.objectId = require("joi-objectid")(Joi);

const workoutSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 20,
  },
  exercises: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
      minlength: 1,
      unique: true,
    },
  ],
  lastShared: {
    type: Date,
    default: moment().add(-1, "days"),
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Workout = mongoose.model("Workout", workoutSchema);

const validateWorkout = (workout) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(20).required(),
    exercises: Joi.array().items(Joi.objectId().required()),
    lastShared: Joi.date(),
    user: Joi.objectId(),
  });
  return schema.validate(workout);
};

exports.Workout = Workout;
exports.validate = validateWorkout;
