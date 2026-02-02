const epgu = require('../epgu/apiClient.js')
const logger = require('../utils/logger.js')

async function pushDocGoskey (req, res) {
    const { file, snils } = req.body
    const format = req.body.format || 'base64'  // utf-8

    logger.info({method: 'push', snils, format })

    if (!file || !snils) {
        return res.status(400).json({ error: 'file and snils is required' })
    }

    if (!['utf-8', 'base64'].includes(format)) {
        return res.status(400).json({ error: 'Allowed format: utf-8, base64' })
    }

    const dataBuffer = Buffer.from(file, format)

    const apiRes = await epgu.pushDocGoskey(snils, dataBuffer)
    logger.info({ response: apiRes })

    res.json(apiRes)
}

async function statusGoskey (req, res) {
    const orderId = req.query.orderId

    logger.info({method: 'status', orderId })

    if (!orderId) {
        return res.status(400).json({ error: 'orderId is required' })
    }

    const apiRes = await epgu.statusGoskey(orderId)
    logger.info({ response: apiRes })

    res.json(apiRes)
}


async function downloadGoskey (req, res) {
    const orderId = req.query.orderId

    logger.info({method: 'download', orderId })

    if (!orderId) {
        return res.status(400).json({ error: 'orderId is required' })
    }

    const apiRes = await epgu.downloadGoskey(orderId, req.query.mimeType)
    logger.info({ response: apiRes })

    res.json(apiRes)
}

module.exports = {
    pushDocGoskey,
    statusGoskey,
    downloadGoskey,
}