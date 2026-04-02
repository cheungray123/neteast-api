/**
 * 日志模块
 * CF Workers 简化版本
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

let currentLevel = LOG_LEVELS.INFO

function formatTime() {
  return new Date().toISOString()
}

function log(level, ...args) {
  if (level >= currentLevel) {
    const prefix = `[${formatTime()}] `
    console.log(prefix, ...args)
  }
}

export const logger = {
  debug: (...args) => log(LOG_LEVELS.DEBUG, '[DEBUG]', ...args),
  info: (...args) => log(LOG_LEVELS.INFO, '[INFO]', ...args),
  warn: (...args) => log(LOG_LEVELS.WARN, '[WARN]', ...args),
  error: (...args) => log(LOG_LEVELS.ERROR, '[ERROR]', ...args),
  setLevel: (level) => { currentLevel = level }
}

export default logger
