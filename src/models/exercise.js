const Joi = require("joi");
const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sets: {
    type: Number,
    required: true,
  },
  weights: {
    type: [Number],
    required: true,
  },
  reps: {
    type: [Number],
    required: true,
  },
  pr: { type: Number, default: 0 },
});

const exercise = mongoose.model("exercise", exerciseSchema);

const validateExercise = (exercise) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    sets: Joi.number().min(0).required(),
    weights: Joi.array().items(Joi.number().required()), // this is the actual password so it's max is 255
    reps: Joi.array().items(Joi.number().required()),
    pr: Joi.number().min(0),
  });
  return schema.validate(exercise);
};

exports.exercise = exercise;
exports.validate = validateExercise;
