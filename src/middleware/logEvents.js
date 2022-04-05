const { format } = require('date-fns')
//const { v4: uuid } = require('uuid');

const fs = require('fs')
const fsPromises = require('fs').promises
const path = require('path')

const logEvents = async (message, logName) => {
    const dateTime = `${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`
    const logItem = `${dateTime}\t${message}\n`

    try {
        if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
            await fsPromises.mkdir(path.join(__dirname, '..', 'logs'))
        }

        await fsPromises.appendFile(
            path.join(__dirname, '..', 'logs', logName),
            logItem
        )
    } catch (err) {
        console.log(err)
    }
}

const logger = (req, res, next) => {
    const dateTime = `${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`
    logEvents(
        `${req.clientIp}\t${req.method}\t${req.hostname}\t${req.url}`,
        'reqLog.txt'
    )
    console.log(
        `${dateTime} ${req.clientIp} ${req.method} ${req.hostname} ${req.path}`
    )
    next()
}

module.exports = { logger, logEvents }
