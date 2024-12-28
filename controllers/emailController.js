// backend/controllers/emailController.js
const sendEmail = require('../utils/sendEmail');

/**
 * Controller pentru trimiterea email-urilor
 * Aici poți adăuga funcționalități specifice de trimitere a email-urilor
 */
exports.sendEmail = async (req, res) => {
    const { to, subject, html, attachments } = req.body;

    try {
        await sendEmail(to, subject, html, attachments);
        res.status(200).json({ message: 'Email trimis cu succes!' });
    } catch (error) {
        console.error('Eroare la trimiterea email-ului:', error);
        res.status(500).json({ message: 'Eroare la trimiterea email-ului.' });
    }
};
