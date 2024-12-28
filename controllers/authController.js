// backend/controllers/authController.js
const { User, Administrator, MagicLink } = require('../models');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.requestMagicLink = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email este necesar.' });
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Utilizatorul nu a fost găsit.' });
        }

        const admin = await Administrator.findOne({ where: { userId: user.id } });
        if (!admin) {
            return res.status(403).json({ message: 'Acces refuzat. Nu sunteți administrator.' });
        }

        // Generarea unui token unic
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Link valid 15 minute

        // Stocarea token-ului
        await MagicLink.create({ token, userId: user.id, expiresAt });

        // Crearea link-ului magic
        const magicLink = `${process.env.BASE_URL}/api/auth/validate-magic-link?token=${token}`;

        // Trimiterea email-ului
        const html = `<p>Salut,</p>
                      <p>Folosește următorul link pentru a te autentifica:</p>
                      <a href="${magicLink}">Autentificare</a>
                      <p>Link-ul este valabil 15 minute.</p>`;

        await sendEmail(email, 'Link de autentificare OnEdu Admin Dashboard', html);

        res.json({ message: 'Link-ul magic a fost trimis pe email.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Eroare la trimiterea link-ului magic.' });
    }
};

exports.validateMagicLink = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: 'Token-ul este necesar.' });
    }

    try {
        const magicLink = await MagicLink.findOne({ where: { token } });

        if (!magicLink) {
            return res.status(400).json({ message: 'Link invalid sau expirat.' });
        }

        if (magicLink.expiresAt < new Date()) {
            await magicLink.destroy();
            return res.status(400).json({ message: 'Link-ul a expirat.' });
        }

        const user = await User.findByPk(magicLink.userId);
        if (!user) {
            return res.status(400).json({ message: 'Utilizatorul nu a fost găsit.' });
        }

        // Generarea unui JWT pentru sesiune
        const tokenJWT = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Ștergerea link-ului magic după utilizare
        await magicLink.destroy();

        // Redirecționarea cu token-ul JWT
        res.redirect(`${process.env.BASE_URL}/dashboard?token=${tokenJWT}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Eroare la validarea link-ului magic.' });
    }
};
