const { Workout } = require("../models/workout");

module.exports = async (req, res, next) => {
  const workout = await Workout.findById(req.params.id);
  if (!workout || workout.creator != req.user._id)
    return res
      .status(404)
      .send("The workout found does not belong to the current user");
  next();
};
