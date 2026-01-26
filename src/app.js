import express from 'express';
import errorMiddleware from './middlewares/error.middleware.js';
import AppError from './utils/AppError.js';

const app = express();

// Middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Routes

// Handle Unhandled Routes (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error Middleware
app.use(errorMiddleware);

export default app;
