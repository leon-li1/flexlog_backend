const Joi = require("joi");
const mongoose = require("mongoose");

const shareSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  workouts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workout",
    },
  ],
  dateShared: {
    type: Date,
    default: Date.now,
  },
});

const Share = mongoose.model("Share", shareSchema);

const validateShare = (share) => {
  const schema = Joi.object({
    owner: Joi.objectId().required(),
    workouts: Joi.array().items(Joi.objectId().required()),
  });
  return schema.validate(share);
};

exports.Share = Share;
exports.validate = validateShare;
