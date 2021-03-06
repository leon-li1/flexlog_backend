const express = require("express");
const login = require("../routes/login");
const logout = require("../routes/logout");
const users = require("../routes/users");
const workouts = require("../routes/workouts");
const points = require("../routes/points");
const sharing = require("../routes/sharing");
const error = require("../middleware/error");
const cors = require("cors");

module.exports = (app) => {
  app.use(cors({ origin: process.env.ORIGIN, credentials: true }));
  app.use(express.json());
  app.use("/api/users", users);
  app.use("/api/login", login);
  app.use("/api/logout", logout);
  app.use("/workouts", workouts);
  app.use("/points", points);
  app.use("/sharing", sharing);
  app.use(error);
};
