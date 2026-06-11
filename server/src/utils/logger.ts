// ============================================================
// LOGGER — Simple typed logger utility
// ============================================================
import config from '../config';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLogLevel =
  LOG_LEVELS[(config.logLevel.toLowerCase() as LogLevel)] ?? LOG_LEVELS.info;

const formatMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

const log = (level: LogLevel, message: string, ...params: unknown[]): void => {
  if (LOG_LEVELS[level] > currentLogLevel) return;
  const formatted = formatMessage(level, message);
  switch (level) {
    case 'error': console.error(formatted, ...params); break;
    case 'warn':  console.warn(formatted, ...params);  break;
    case 'info':  console.info(formatted, ...params);  break;
    case 'debug': console.debug(formatted, ...params); break;
  }
};

const logger = {
  error: (msg: string, ...p: unknown[]) => log('error', msg, ...p),
  warn:  (msg: string, ...p: unknown[]) => log('warn',  msg, ...p),
  info:  (msg: string, ...p: unknown[]) => log('info',  msg, ...p),
  debug: (msg: string, ...p: unknown[]) => log('debug', msg, ...p),
};

export default logger;
