const Joi = require("joi");
const mongoose = require("mongoose");
const moment = require("moment");
Joi.object = require("joi-objectid");

const workoutSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 20,
  },
  exercises: {
    type: mongoose.schema.Types.ObjectId,
    ref: "exercise",
    required: true,
    minlength: 1,
    unique: true,
  },
  lastShared: {
    type: Date,
    default: moment().add(-1, "days"),
  },
});

const workout = mongoose.model("workout", workoutSchema);

const validateWorkout = (workout) => {
  const schema = Joi.object({
    name: Joi.string().min(5).max(50).required(),
    exercises: Joi.array().items(Joi.objectId().required()),
  });
  return schema.validate(workout);
};

exports.workout = workout;
exports.validate = validateWorkout;
