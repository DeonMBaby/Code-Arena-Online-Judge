function errorHandler(err, req, res, next) {
  console.error('Unhandled request error:', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl
  });

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.statusCode || err.status || 500).json({
    message: 'Something went wrong. Please try again later.'
  });
}

module.exports = errorHandler;
