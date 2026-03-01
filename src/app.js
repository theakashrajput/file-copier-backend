import express from 'express';
import errorMiddleware from './middlewares/error.middleware.js';
import AppError from './utils/AppError.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// Middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Routes
import userRoutes from './routes/user.route.js';
import fileRoutes from './routes/file.route.js';

app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/files', fileRoutes);

app.get('/', (req, res) => {
  res.send('Hello World from File Copier!');
});

// Handle Unhandled Routes (404)
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this domain!`, 404));
});

// Error Middleware
app.use(errorMiddleware);

export default app;
