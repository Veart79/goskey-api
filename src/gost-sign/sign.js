const fs = require('fs')
const path = require('path')
const axios = require('axios')

//const  base64url  =  require('base64url')
const  { gostCrypto }  = require('./lib')



function my_base64url(string, encoding) {
  return Buffer.from(string, encoding).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}


const sign = async (buffer, certname, signedAttr) => {
  try {

    // var content = gostCrypto.coding.Chars.decode(text, 'utf-8'); // ArrayBuffer from utf-8 string 
    // from Buffer to ArrayBuffer
    var content = new Uint8Array(buffer).buffer

    const certDir = process.env.ESIA_CERT_DIR ? process.env.ESIA_CERT_DIR : path.join(__dirname, '../data')
    const certPath = certDir + '/' + (certname || process.env.ESIA_CERTNAME_DEF)

    var key = new gostCrypto.asn1.PrivateKeyInfo(fs.readFileSync(certPath + '.key').toString());
    var cert = new gostCrypto.cert.X509(fs.readFileSync(certPath + '.crt').toString());

    msg = new gostCrypto.cms.SignedDataContentInfo();
    msg.setEnclosed(content);
    msg.writeDetached(true);
    msg.content.certificates = [cert];
    signedAttr =  signedAttr === undefined ? true : signedAttr

    await msg.addSignature(key, cert, signedAttr);

    return { signBuffer: Buffer.from(msg.encode('DER')) }
  } catch (error) {
    return { signBuffer: null, error: error.message }
    console.log(error)
  }
}


const getCertAlgName = certData => {
  const cert = new gostCrypto.cert.X509(certData);
  return cert.signatureAlgorithm.name;
}

async function verify(data, sigFile, crtFile) {
  // Create a signed data info
  var verifier, msg;
  // Get the content for detached mode
  var content = gostCrypto.coding.Chars.decode(data, 'utf-8');
  var data = fs.readFileSync(sigFile).toString() //``// sig
  var signerCert = fs.readFileSync(crtFile).toString()

  msg = new gostCrypto.cms.SignedDataContentInfo(data);

  // Use the signer's certificate
  var cert = new gostCrypto.cert.X509(signerCert);
  verifier = msg.verifySignature(cert, content);

  verifier.then(function () {
      // Signature verified
      console.log('Yes: Signature verified')
      return true
  }, function (reason) {
      // Reject if signature not verified
      console.log('No: ' + reason.message)
      return false
  });
}


/* examples
  getCertAlgName(fs.readFileSync('esia2024.crt').toString())
  sign('0c84e183-bd2c-47f4-9fb8-8281142c2048').then(res => res.toString('base64url')).then(console.log)
  verify(data, filename +'.'+ certname + '.cms.sig.base64', certname+'.crt')
*/

  module.exports = {
    sign,
    verify,
    getCertAlgName
  }