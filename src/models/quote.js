const Joi = require("joi");
const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    default: "Uknown",
  },
});

const quote = mongoose.model("quote", quoteSchema);

const validateQuote = (quote) => {
  const schema = Joi.object({
    text: Joi.string().required(),
    author: Joi.string(),
  });
  return schema.validate(quote);
};

exports.quote = quote;
exports.validate = validateQuote;
