import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFound(req: Request, res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.path}`, 404));
}

export function errorHandler(
  err: Error & { statusCode?: number; isOperational?: boolean },
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Accept statusCode from AppError instances OR from plain errors with a statusCode property
  const statusCode = err.statusCode ?? 500;
  const isOperational = err instanceof AppError || (err.statusCode !== undefined && statusCode < 500);

  // Don't leak internal errors in production
  const message =
    isOperational || process.env['NODE_ENV'] !== 'production'
      ? err.message
      : 'Internal server error';

  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ERROR:`, {
      path: req.path,
      method: req.method,
      statusCode,
      message: err.message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: message,
    ...(process.env['NODE_ENV'] === 'development' && !isOperational
      ? { stack: err.stack }
      : {}),
  });
}
