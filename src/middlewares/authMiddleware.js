const fs = require('fs');
const path = require('path');

module.exports = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }
    
    try {
        const tokensPath = path.join(__dirname, '../data/tokens.json');
        const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
        
        if (!tokens.includes(token)) {
            return res.status(403).json({ message: 'Недействительный токен' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Ошибка при проверке токена' });
    }

    next();
};