const signer = require('../gost-sign/sign.js')

module.exports = {
    sign: (req, res) => {
        const format = req.body.format || 'base64'  // utf-8
        const outformat = req.body.outformat || 'base64'  // utf-8
        const signedAttr = req.body.signedAttr === undefined ? true : req.body.signedAttr  // utf-8

        if (!req.body.data) {
            return res.status(400).json({ error: 'data is required' })
        }

        if (!['utf-8', 'base64'].includes(format)) {
            return res.status(400).json({ error: 'Allowed format: utf-8, base64' })
        }

        if (!['utf-8', 'base64', 'base64url'].includes(outformat)) {
            return res.status(400).json({ error: 'Allowed outformat: utf-8, base64' })
        }


        const data = Buffer.from(req.body.data, format)

        signer.sign(data, req.body.certname, signedAttr)
            .then(signRes => res.json({ signature: signRes.signBuffer?.toString(outformat), error: signRes.error }))
    }
}





