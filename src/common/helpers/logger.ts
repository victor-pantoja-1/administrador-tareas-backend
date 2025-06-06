import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

const logFormat = format.combine(
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf((info) => {
    const log = {
      time: info.timestamp,
      level: info.level,
      code: info.code || null,
      method: info.method || null,
      url: info.url || null,
      message: info.message,
    };
    return JSON.stringify(log);
  }),
);

const infoLogger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new transports.DailyRotateFile({
      filename: 'logs/info-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

const warnLogger = createLogger({
  level: 'warn',
  format: logFormat,
  transports: [
    new transports.DailyRotateFile({
      filename: 'logs/warn-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'warn',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

const errorLogger = createLogger({
  level: 'error',
  format: logFormat,
  transports: [
    new transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

export { infoLogger, warnLogger, errorLogger };
