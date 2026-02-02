const pino = require('pino');
const fs = require('fs');
const path = require('path')
const moment = require('moment')

const isProduction = process.env.NODE_ENV === 'production';

const logConfig = {
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  base: { },     // Отключаем pid и hostname
}

const ts = moment().format('YYYY-MM-DDTHHmm')

// Автоматически создать папку logs, если она не существует
const logDir = path.join(__dirname, '../logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

const logfile = path.join(logDir, `${ts}.log`)
const logStream = fs.createWriteStream(logfile)

const logger = pino(logConfig, logStream)

module.exports = logger