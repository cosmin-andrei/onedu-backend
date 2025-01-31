const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, html, attachments) => {
    const mailOptions = {
        from: `Asociația ONedu <${process.env.EMAIL_USER}>`,
        replyTo: "secretariat@onedu.ro",
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
