// src/errors/index.js
const CustomError = require("./CustomError");
const NotFoundError = require("./NotFoundError");
const BadRequestError = require("./BadRequestError");
const UnauthorizedError = require("./UnauthorizedError");
const ForbiddenError = require("./ForbiddenError");
const ConflictError = require("./ConflictError"); 

module.exports = {
  CustomError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
};
