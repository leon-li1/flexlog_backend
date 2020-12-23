const Joi = require("joi");
const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
    maxlength: 20,
    required: true,
  },
  sets: {
    type: Number,
    min: 1,
    required: true,
  },
  weights: {
    type: [Number], // TODO:: min arr size = 1?
    required: true,
  },
  reps: {
    type: [Number],
    required: true,
  },
  scores: [Number],
  pr: Number,
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

const validateExercise = (exercise) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(20).required(),
    sets: Joi.number().min(1).required(),
    weights: Joi.array().items(Joi.number().required()),
    reps: Joi.array().items(Joi.number().required()),
    scores: Joi.array().items(Joi.number()),
    pr: Joi.number().min(0),
  });
  return schema.validate(exercise);
};

exports.Exercise = Exercise;
exports.validate = validateExercise;
