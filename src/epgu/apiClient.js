const fs = require('fs')
const path = require('path')
const { jwtDecode } = require('jwt-decode')
const signer = require('../gost-sign/sign.js')
const axios = require('axios')
const FormData = require('form-data')
const moment = require('moment')
const { zip } = require('zip-a-folder');
const JSZip = require('jszip');
const logger = require('../utils/logger.js')

/**
 * TODO: Обработка ошибок и логирование
 */



async function pushDocGoskey (snils, dataBuffer) {
    // Получаем токен ЕСИА
    const token = await getToken(process.env.ESIA_API_KEY)

    const zipfile = await createOrderZip(dataBuffer, snils) // buffer

    fs.writeFileSync(path.join(__dirname, '../logs/goskeyRequest.zip'), zipfile)

    const form = new FormData();
    form.append("meta", '{"region":"24", "serviceCode":"10000000374", "targetCode":"-10000000374"}', { contentType: 'application/json' })
    form.append("file", zipfile, 'file.zip');

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: process.env.EPGU_API_URL + '/gusmev/push', //'https://svcdev-beta.test.gosuslugi.ru/api/gusmev/push',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...form.getHeaders()
        },
        data : form
    }

    try {
        const res = await axios.request(config)
        console.log(res.data)
        return res.data
    } catch(error) {
        console.log(error.response?.data)
        return error.response?.data
    }

}

async function createOrderZip(dataBuffer, snils) {
    // Создать заявление req.xml
    const reqXml = getReqXml(snils)

    // Подписать заявление
    const reqXmlBuffer = Buffer.from(reqXml, 'utf-8')
    const signRes = await signer.sign(reqXmlBuffer) // , certname
    //const signatureBase64url = signRes.signBuffer?.toString('base64url')

    // Подписать файл (dataBuffer)
    const signDocRes = await signer.sign(dataBuffer)

    // Заархивировать в zip
    const files = {
        "req.xml": reqXml,
        "req.xml.sig": signRes.signBuffer,
        "doc.xml": dataBuffer,
        "doc.xml.sig": signDocRes.signBuffer,
    }

    try {
        const zipData = await createZipFromVariables(files)
        console.log("ZIP archive created successfully.  Buffer length:", zipData.length)
        return zipData //is a Buffer containing the ZIP archive
    } catch (error) {
        logger.error(error, "Error creating ZIP archive:" )
    }

    return null
}


/**
 * files: {
 *   [filename: string]: string | Buffer
 * }
 */
async function createZipFromVariables(files) {

    const zip = new JSZip();

    for (const filename in files) {
        if (files.hasOwnProperty(filename)) {
            const data = files[filename];
            zip.file(filename, data);
        }
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    return zipBuffer; // Returns a Buffer containing the ZIP data
}


function getReqXml(snils) {
    /* Переменные в req.xml:
        snils
        documentId
        description
        SignExpiration (2025-02-04T17:22:00.000+03:00)
    */

    const filePath =  path.join(__dirname, '../data/req.xml.tpl')
    if (!fs.existsSync(filePath)) return false

    const signExpiration = moment().add(7, 'days').format('YYYY-MM-DDTHH:mm:ss.SSSZ')

    let content = fs.readFileSync(filePath).toString()
    content = content.replace('{snils}', snils)
        .replace('{documentId}', Math.floor(Math.random() * 100000000))
        .replace('{description}', 'Документ от МЗ КК')
        .replace('{signExpiration}', signExpiration)

    return content
}

async function statusGoskey (orderId) {
    // Получаем токен ЕСИА
    const token = await getToken(process.env.ESIA_API_KEY)


    // Запрос к ЕПГУ на получение статуса
    try {
        const res = await axios.post(
            process.env.EPGU_API_URL + '/gusmev/order/' + orderId + '?embed=STATUS_HISTORY',
            {
                "region":"24",
                "serviceCode":"10000000374",
                "targetCode":"-10000000374"
            },
            { headers: {"Content-Type": "application/json", "Authorization" : `Bearer ${token}`} }
        )

        console.log(res.data)
        if (res.data?.order) {
            return JSON.parse(res.data?.order)
        }

        return res.data
    } catch(error) {
        console.log(error.res?.data || error.message)
        return error.res?.data || error.message
    }
}

async function downloadGoskey(orderId, mimeType) {
    const status = await statusGoskey(orderId)

    if(status.orderStatusId != 3) {
        logger.warn({method: 'downloadGoskey', orderId }, 'Документы не подписаны, скачивание невозможно')
        return false
    }

    if (!mimeType)  mimeType = "application/x-pkcs7-signature"

    const item = status.orderResponseFiles?.find(el => el.mimeType == mimeType)
    if (!item?.link) {
        logger.warn({method: 'downloadGoskey', status }, 'Подпись не найдена, скачивание невозможно')
        return false
    }

    const parts = item.link.split('/')   //"link": "terrabyte://00/21001646170/doc.xml/3",

    const pem = await downloadGoskeyByParams(parts[3], parts[4])
    return { signature: pem }
}


async function downloadGoskeyByParams(num, mnemonic) {
    // Получаем токен ЕСИА
    const token = await getToken(process.env.ESIA_API_KEY)


    // Запрос к ЕПГУ на добавление документа для подписи
    try {
        const res = await axios.get(
            process.env.EPGU_API_URL + `/storage/v2/files/${num}/3/download?mnemonic=${mnemonic}`,
            {
                responseType: 'arraybuffer',
                headers: {"Authorization" : `Bearer ${token}`}
            }
        )

        const buffer = Buffer.from(res.data, 'binary')
        const base64String = buffer.toString('base64')

        return base64String
    } catch(error) {
        console.log(error.res?.data || error.message)
        return error.res?.data || error.message
    }
}

async function getToken (apiKey, certname) {
    // get from cache file
    const tokenPath =  path.join(__dirname, '../data/esia-token.json')
    // check file exists
    if (fs.existsSync(tokenPath)) {
        const content = fs.readFileSync(tokenPath).toString()
        const tokenData = JSON.parse(content)

        // check expired
        if (tokenData.expired - 60 > Date.now()/1000) {
            return tokenData.token
        }
    }


    //  else request new token
    const apiKeyBuffer = Buffer.from(apiKey, 'utf-8')
    const signRes = await signer.sign(apiKeyBuffer, certname)
    const signatureBase64url = signRes.signBuffer?.toString('base64url')
    if (!signatureBase64url) {
        return ''
    }

    const token = await requestToken(signatureBase64url)

    return token
}

async function requestToken (signatureBase64url) {
    try {
        const res = await axios.get(process.env.ESIA_API_URL + '/' + process.env.ESIA_API_KEY + '/tkn?signature=' + signatureBase64url)
        console.log(res.data)
        if (!res.data.accessTkn) {
            return ''
        }

        // save to file for caching, keep expired time
        const decoded = jwtDecode(res.data.accessTkn)
        const tokenPath =  path.join(__dirname, '../data/esia-token.json')
        fs.writeFileSync(tokenPath, JSON.stringify({ token: res.data.accessTkn, expired: decoded.exp }))

        return res.data.accessTkn
    } catch(error) {
        // handle error
        console.log(error.res?.data || error.message)
        return error.res?.data || error.message
    }
}

module.exports = {
    getToken,
    requestToken,
    pushDocGoskey,
    statusGoskey,
    downloadGoskey
}