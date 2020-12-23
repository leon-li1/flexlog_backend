const Joi = require("joi");

module.exports.validateWokout = (req) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(20).required(),
    numExercises: Joi.number().min(1).required(),
    eNames: Joi.array().items(Joi.string().min(3).max(20).required()),
    eSets: Joi.array().items(Joi.number().min(1).required()),
    eWeights: Joi.array().items(
      Joi.array().items(Joi.number().min(1).required())
    ),
    eReps: Joi.array().items(Joi.array().items(Joi.number().min(1).required())),
  });
  return schema.validate(req);
};

// note: the length of the inner array of eWeights and eReps is not validated
module.exports.validateUpdate = (req) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(20),
    numExercises: Joi.number().min(0),
    eNames: Joi.array()
      .length(req.numExercises)
      .items(Joi.string().min(3).max(20)),
    numExistingExercises: Joi.number().min(0),
    existingExercises: Joi.array().items(Joi.objectId()),
    eSets: Joi.array().length(req.numExercises).items(Joi.number().min(1)),
    eWeights: Joi.array()
      .length(req.numExercises)
      .items(Joi.array().items(Joi.number().min(1))),
    eReps: Joi.array()
      .length(req.numExercises)
      .items(Joi.array().items(Joi.number().min(1))),
  });
  return schema.validate(req);
};
