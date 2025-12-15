/**
 * Middleware de tratamento de erros global
 */

import { Request, Response, NextFunction } from 'express';
import { handleError } from '../utils/errorHandler';

export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  handleError(error, res);
};
