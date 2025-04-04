const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {sequelize} = require('./models');
const authRoutes = require('./routes/authRoutes');
const emailRoutes = require('./routes/emailRoutes');
const userRoutes = require('./routes/userRoutes');
const formulare230Routes = require('./routes/formulare230Routes');
const donationRoutes = require('./routes/donationRoutes');
const blogRouter = require('./routes/blogRoutes');
const sponsorizariRoutes = require('./routes/sponsorizariRoutes');
const rateLimit = require('express-rate-limit');
const ftpRoutes = require('./routes/ftpRoutes');
const logger = require('./utils/logger');
const dashboardRoutes = require('./routes/dashboardRoutes');
require('dotenv').config();
require('./jobs/donationStatusChecker');
const authenticateJWT = require("./middlewares/authenticateJWT");

const app = express();


app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(bodyParser.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
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
console.log("dashboardRoutes loaded:", dashboardRoutes);
app.use('/api/dashboardstats/', dashboardRoutes);
app.use("/api/dashboard", (req, res, next) => {
    if (req.path !== "/login") {
        return authenticateJWT(req, res, next);
    }
    next();
});


app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        console.log(r.route.path);
    }
});


app.get('/api/test', (req, res) => {
    res.json({message: 'Serverul funcționează corect!'});
});

app.use((err, req, res, next) => {
    logger.error('Eroare necaptată:', {error: err.message, stack: err.stack});

    if (!res.headersSent) {
        res.status(500).json({message: 'A apărut o eroare internă!'});
    }
});


const PORT = process.env.PORT || 5000;

sequelize.sync().then(() => {
    app.listen(PORT, () => {
        logger.info(`Serverul rulează pe portul ${PORT}`);
    });
}).catch(err => {
    logger.error('Eroare la sincronizarea bazei de date:', {error: err.message});
});

process.on('SIGINT', async () => {
    console.log('🛑 Închidere conexiune SQLite...');
    await sequelize.close();
    process.exit(0);
});
