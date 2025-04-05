const nodemailer = require('nodemailer');
require('dotenv').config();
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USERCP,
        pass: process.env.EMAIL_PASSCP,
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendEmail = async (to, subject, html, attachments) => {
    const mailOptions = {
        from: `Asociația ONedu <${process.env.EMAIL_USERCP}>`,
        replyTo: 'contact@onedu.ro',
        to,
        bcc: 'site@onedu.ro',
        subject,
        html,
        attachments
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Email trimis cu succes către ${to} | Subiect: "${subject}"`);
    } catch (error) {
        logger.error(`Eroare la trimiterea email-ului către ${to} | Subiect: "${subject}"`, {
            error,
            to,
            subject,
            attachmentsCount: attachments?.length || 0
        });
        throw error;
    }
};

module.exports = sendEmail;
