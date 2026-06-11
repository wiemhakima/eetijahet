// ============================================================
// ERROR MIDDLEWARE — 404 + global error handler (TypeScript)
// ============================================================
import { Request, Response, NextFunction } from 'express';
import config from '../../config';
import logger from '../../utils/logger';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new Error(`Not Found — ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (
  err: Error & { statusCode?: number },
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`Error: ${err.message}`);
  if (config.environment === 'development') {
    logger.error(err.stack ?? '');
  }

  const statusCode = res.statusCode === 200 ? (err.statusCode ?? 500) : res.statusCode;

  res.status(statusCode).json({
    success: false,
    error: err.message,
    stack: config.environment === 'production' ? '🥞' : err.stack,
    path: req.originalUrl,
  });
};
