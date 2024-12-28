// backend/controllers/userController.js
const { User } = require('../models');

/**
 * Obține detaliile unui utilizator după ID
 */
exports.getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id, {
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        });

        if (!user) {
            return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Eroare la obținerea utilizatorului:', error);
        res.status(500).json({ message: 'A apărut o eroare la obținerea utilizatorului.' });
    }
};

/**
 * Actualizează detaliile unui utilizator după ID
 */
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });
        }

        await user.update(updateData);

        res.status(200).json({ message: 'Utilizatorul a fost actualizat cu succes.' });
    } catch (error) {
        console.error('Eroare la actualizarea utilizatorului:', error);
        res.status(500).json({ message: 'A apărut o eroare la actualizarea utilizatorului.' });
    }
};

/**
 * Șterge un utilizator după ID
 */
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });
        }

        await user.destroy();

        res.status(200).json({ message: 'Utilizatorul a fost șters cu succes.' });
    } catch (error) {
        console.error('Eroare la ștergerea utilizatorului:', error);
        res.status(500).json({ message: 'A apărut o eroare la ștergerea utilizatorului.' });
    }
};
