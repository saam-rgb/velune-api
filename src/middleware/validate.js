const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw ApiError.badRequest('Validation error', errors.array().map(e => ({
      field: e.path,
      message: e.msg,
    })));
  }
  next();
};

module.exports = validate;
