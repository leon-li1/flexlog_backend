module.exports = () => {
  if (!process.env.JWT_PRIVATE_KEY)
    throw new Error("FATAL ERROR: jwtPrivateKey is not defined");
};
