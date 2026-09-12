export function successResponse(data, message = 'Success') {
  return { success: true, message, data };
}

export function errorResponse(message = 'Error', statusCode = 500, details = null) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.details = details;
  return err;
}

export function notFound(message = 'Resource not found') {
  return errorResponse(message, 404);
}

export function forbidden(message = 'Access denied') {
  return errorResponse(message, 403);
}

export function validationError(details) {
  return errorResponse('Validation failed', 400, details);
}

export function errorHandler(err, req, res, next) {
  console.error('Error:', err.message, err.stack);
  
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    error: err.message || 'Internal server error',
  };
  
  if (err.details) {
    response.details = err.details;
  }
  
  res.status(statusCode).json(response);
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}