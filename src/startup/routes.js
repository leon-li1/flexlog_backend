const express = require("express");
const login = require("../routes/login");
const users = require("../routes/users");
const workouts = require("../routes/workouts");
const points = require("../routes/points");
const error = require("../middleware/error");

module.exports = (app) => {
  app.use(express.json());
  app.use("/api/users", users);
  app.use("/api/login", login);
  app.use("/workouts", workouts);
  app.use("/points", points);
  app.use(error);
};
