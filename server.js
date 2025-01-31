const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sequelize } = require('./models');
const authRoutes = require('./routes/authRoutes');
const emailRoutes = require('./routes/emailRoutes');
const userRoutes = require('./routes/userRoutes');
const formulare230Routes = require('./routes/formulare230Routes');
const donationRoutes = require('./routes/donationRoutes');
const smartPayRoutes = require('./routes/smartPayRoutes');
const blogRouter = require('./routes/blogRoutes');
const sponsorizariRoutes = require('./routes/sponsorizariRoutes');
const rateLimit = require('express-rate-limit');
const ftpRoutes = require('./routes/ftpRoutes');
const logger = require('./utils/logger');
require('dotenv').config();
require('./jobs/donationStatusChecker');

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minute
    max: 100,
    message: 'Prea multe cereri de la această adresă IP, încearcă mai târziu.'
});

app.use(limiter);

app.use('/ftp', ftpRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/users', userRoutes);
app.use('/api/formulare230', formulare230Routes);
app.use('/api/donations', donationRoutes);
app.use('/api/blog', blogRouter);
app.use('/api/sponsorizare', sponsorizariRoutes);


app.get('/api/dashboard', require('./middlewares/authenticateJWT'), (req, res) => {
    res.json({ message: `Bine ai venit, utilizatorul cu ID-ul ${req.user.userId}!` });
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'Serverul funcționează corect!' });
});

app.use((err, req, res, next) => {
    logger.error('Eroare necaptată:', { error: err.message, stack: err.stack });
    res.status(500).json({ message: 'A apărut o eroare!' });
});

const PORT = process.env.PORT || 5000;

sequelize.sync().then(() => {
    app.listen(PORT, () => {
        logger.info(`Serverul rulează pe portul ${PORT}`);
    });
}).catch(err => {
    logger.error('Eroare la sincronizarea bazei de date:', { error: err.message });
});
