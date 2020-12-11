const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const iv = crypto.randomBytes(16);

const encrypt = (text) => {
    const cipher = crypto.createCipheriv(algorithm, process.env.SECRET_KEY, iv);
    
    try {
        const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
        return {
            iv: iv.toString('hex'),
            content: encrypted.toString('hex')
        };
    } catch (ex) {
        return
    }
};

const decrypt = (hash) => {
    const decipher = crypto.createDecipheriv(algorithm, process.env.SECRET_KEY, (Buffer.from(hash.iv, 'hex')));

    try {
        const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
        return decrpyted.toString();
    } catch (ex) {
        return ""
    }
};

module.exports = {
    encrypt,
    decrypt
};