const { sign } = require('../controllers/signController')
const doc = require('../controllers/docController')

exports.setRoutes = (app) => {
    app.post('/sign', sign)

    app.post('/push', doc.pushDocGoskey)

    app.get('/status', doc.statusGoskey)

    app.get('/pull', doc.downloadGoskey)

};