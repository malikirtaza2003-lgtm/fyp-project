import { HttpError } from '../utils/http-error.js';

function normalizeError(error) {
  if (error instanceof HttpError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
    };
  }

  if (error?.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: Object.values(error.errors)
        .map((entry) => entry.message)
        .join(', '),
    };
  }

  if (error?.name === 'CastError') {
    return {
      statusCode: 400,
      message: 'Invalid resource id',
    };
  }

  if (error?.code === 11000) {
    const duplicateField = Object.keys(error.keyValue ?? {})[0] ?? 'value';

    return {
      statusCode: 409,
      message: `${duplicateField} already exists`,
    };
  }

  if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      message: 'Invalid or expired token',
    };
  }

  return {
    statusCode: 500,
    message: 'Internal server error',
  };
}

export function notFound(req, _res, next) {
  next(new HttpError(404, `Route not found: ${req.originalUrl}`));
}

export function errorHandler(error, _req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const normalizedError = normalizeError(error);
  const response = {
    message: normalizedError.message,
  };

  if (process.env.NODE_ENV !== 'production' && normalizedError.statusCode === 500) {
    response.stack = error?.stack;
  }

  res.status(normalizedError.statusCode).json(response);
}