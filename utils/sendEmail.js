const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * GMAIL
 *
 * const transporter = nodemailer.createTransport({
 *     service: 'Gmail',
 *     auth: {
 *         user: process.env.EMAIL_USER,
 *         pass: process.env.EMAIL_PASS
 *     }
 * });
 *
 *
 */

/**
 * SMTP_HOST=mail.domeniu.ro
 * SMTP_PORT=465
 * EMAIL_USER=noreply@domeniu.ro
 * EMAIL_PASS=parolaSetatăÎnCpanel
 *
 */

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USERCP,
        pass: process.env.EMAIL_PASSCP,
    }
});

const sendEmail = async (to, subject, html, attachments) => {
    const mailOptions = {
        from: `Asociația ONedu <${process.env.EMAIL_USERCP}>`,
        replyTo: 'secretariat@onedu.ro',
        to,
        subject,
        html,
        attachments
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
