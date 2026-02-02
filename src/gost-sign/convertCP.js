/**
 * Извлечение ключа и сертификата из контейнера Криптопро. Контейнер экспортируемый.
 * (Установка контейнера в Криптопро - копируем в папку /var/opt/cprocsp/keys/[user] и кажется это: /opt/cprocsp/bin/amd64/csptestf -absorb -certs)
 * нужен пароль от контейнера (1234567890)
 */

const fs = require('fs');
const { gostCrypto } = require('./lib');

const exportKeyFromContainer = async (password) => {
    var keyContainer = new gostCrypto.keys.CryptoProKeyContainer({
        header: fs.readFileSync('container/header.key').toString('base64'),
        name: fs.readFileSync('container/name.key').toString('base64'),
        primary: fs.readFileSync('container/primary.key').toString('base64'),
        masks: fs.readFileSync('container/masks.key').toString('base64'),
        primary2: fs.readFileSync('container/primary2.key').toString('base64'),
        masks2: fs.readFileSync('container/masks2.key').toString('base64')
    });

    const key = await keyContainer.getKey(password);
    const cert = await keyContainer.getCertificate();

    return [key.encode('PEM'), cert.encode('PEM')].join('\n');
}

exportKeyFromContainer('1234567890').then(console.log)