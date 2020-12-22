const winston = require("winston");
const mongoose = require("mongoose");

module.exports = () => {
  const db = process.env.DB;
  mongoose
    .connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(() => winston.info(`Connected to ${db}`));
};
