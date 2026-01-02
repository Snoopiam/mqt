// Environment-aware logger
// Logs in development, silent in production (unless LOG_LEVEL is set)

const isDev = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'error');

const levels = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = levels[logLevel] ?? levels.info;

const logger = {
  debug: (...args) => currentLevel <= levels.debug && console.log(...args),
  info: (...args) => currentLevel <= levels.info && console.log(...args),
  warn: (...args) => currentLevel <= levels.warn && console.warn(...args),
  error: (...args) => currentLevel <= levels.error && console.error(...args),
};

export default logger;
