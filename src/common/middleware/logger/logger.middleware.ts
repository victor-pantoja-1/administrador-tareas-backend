import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { infoLogger, warnLogger } from 'src/common/helpers/logger';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    infoLogger.info({
      method: req.method,
      url: req.originalUrl,
      message: 'Request received',
      code: res.statusCode,
    });

    res.on('finish', () => {
      if (res.statusCode >= 400) {
        warnLogger.warn({
          method: req.method,
          url: req.originalUrl,
          code: res.statusCode,
          message: 'Request completed with warnings/errors',
        });
      }
    });

    next();
  }
}