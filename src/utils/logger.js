const fs = require('fs')
const path = require('path')

const generateFolderLogs = (dynamicFolder, subPath) => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const date = today.getDate()
  
  const relativeFolderPath = `${dynamicFolder}/${subPath}/${year}/${month}/${date}/`
  const projectRoot = path.resolve(__dirname, '../../')
  const absoluteFolderPath = path.join(projectRoot, relativeFolderPath)
  
  try {
    if (!fs.existsSync(absoluteFolderPath)) {
      console.log('generated folder');
      fs.mkdirSync(absoluteFolderPath, { recursive: true, mode: 0o755 })
    }
    return {
      pathForDatabase: relativeFolderPath,
      folderPath: absoluteFolderPath
    }
  } catch (error) {
    console.error('generateFolderLogs Error:', error.message)
    // Fallback to /tmp in Docker if root directory is not writable
    const fallbackPath = path.join('/tmp', relativeFolderPath)
    try {
      if (!fs.existsSync(fallbackPath)) {
        fs.mkdirSync(fallbackPath, { recursive: true, mode: 0o755 })
      }
      return {
        pathForDatabase: relativeFolderPath,
        folderPath: fallbackPath
      }
    } catch (fallbackErr) {
      console.error('generateFolderLogs Fallback Error:', fallbackErr.message)
      return { folderPath: '/tmp' }
    }
  }
}

const logger = (fileName, type) => {
  try {
    const result = generateFolderLogs('logs', type)
    if (!result || !result.folderPath) throw new Error('Failed to create log directory')
    
    const finalPath = path.join(result.folderPath, fileName)
    return fs.createWriteStream(finalPath, {
      flags: 'a',
      mode: 0o755
    })
  } catch (error) {
    console.error('Logger initialization error:', error.message)
    // Return dummy stream to prevent .write() crashes if everything fails
    return fs.createWriteStream('/dev/null', { flags: 'a' })
  }
}

// Enhanced logger with different log levels
class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    }
    this.currentLevel = this.levels.info
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString()
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}\n`
  }

  log(level, message, meta = {}) {
    if (this.levels[level] <= this.currentLevel) {
      const formattedMessage = this.formatMessage(level, message, meta)
      console.log(formattedMessage.trim())
      
      // Also write to file
      try {
        const result = generateFolderLogs('logs', 'application')
        if (result && result.folderPath) {
          const finalPath = path.join(result.folderPath, 'app.log')
          fs.appendFileSync(finalPath, formattedMessage)
        }
      } catch (error) {
        console.error('Failed to write to log file:', error.message)
      }
    }
  }

  error(message, meta = {}) {
    this.log('error', message, meta)
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta)
  }

  info(message, meta = {}) {
    this.log('info', message, meta)
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta)
  }
}

module.exports = {
  logger,
  Logger: new Logger()
}
