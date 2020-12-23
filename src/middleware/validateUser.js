const { User } = require("../models/user");

module.exports = async (req, res, next) => {
  const isFound = !!(await User.findById(req.user._id));
  if (!isFound) return res.status(404).send("No user found in the database.");
  next();
};
