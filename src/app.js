require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const authMiddleware = require('./middlewares/authMiddleware');
const { setRoutes } = require('./routes/routes');
const cors = require('cors');


const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(authMiddleware);

setRoutes(app);

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});