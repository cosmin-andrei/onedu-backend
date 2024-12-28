// backend/utils/sendEmail.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurează transporter-ul pentru Nodemailer folosind Gmail și App Password
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Funcție pentru trimiterea email-urilor
 * @param {string} to - Destinatarul email-ului
 * @param {string} subject - Subiectul email-ului
 * @param {string} html - Conținutul email-ului în format HTML
 */
const sendEmail = async (to, subject, html) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email trimis cu succes către ${to}`);
    } catch (error) {
        console.error(`Eroare la trimiterea email-ului către ${to}:`, error);
        throw error;
    }
};

module.exports = sendEmail;
