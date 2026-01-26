const LEVELS = ['error', 'warn', 'info', 'debug'];

const currentLevel = (() => {
  const level = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return LEVELS.includes(level) ? level : 'info';
})();

const shouldLog = (level) => {
  const currentIndex = LEVELS.indexOf(currentLevel);
  const targetIndex = LEVELS.indexOf(level);
  return targetIndex !== -1 && targetIndex <= currentIndex;
};

const logger = {
  debug: (...args) => {
    if (shouldLog('debug')) {
      console.debug(...args);
    }
  },
  info: (...args) => {
    if (shouldLog('info')) {
      console.info(...args);
    }
  },
  warn: (...args) => {
    if (shouldLog('warn')) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    if (shouldLog('error')) {
      console.error(...args);
    }
  }
};

module.exports = logger;
