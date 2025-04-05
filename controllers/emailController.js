const sendEmail = require('../utils/sendEmail');
const logger = require('../utils/logger'); // Importă loggerul

exports.sendEmail = async (req, res) => {
    const { to, subject, html, attachments } = req.body;

    try {
        await sendEmail(to, subject, html, attachments);
        logger.info(`Email trimis cu succes prin endpoint către ${to} | Subiect: "${subject}"`);
        res.status(200).json({ message: 'Email trimis cu succes!' });
    } catch (error) {
        logger.error('Eroare la trimiterea email-ului prin endpoint:', {
            error: error.message,
            to,
            subject,
            attachmentsCount: attachments?.length || 0
        });
        res.status(500).json({ message: 'Eroare la trimiterea email-ului.' });
    }
};
