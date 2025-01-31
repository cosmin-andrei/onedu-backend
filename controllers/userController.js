// backend/controllers/userController.js
const { User } = require('../models');

exports.getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id, {
            attributes: { exclude: ['createdAt', 'updatedAt', 'password'] }
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

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }
        });

        res.status(200).json(users);
    } catch (error) {
        console.error('Eroare la obținerea utilizatorilor:', error);
        res.status(500).json({ message: 'A apărut o eroare la obținerea utilizatorilor.' });
    }
};

exports.createUser = async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            return res.status(409).json({ message: 'Email-ul este deja folosit.' });
        }

        const newUser = await User.create({ username, email, password, role });

        res.status(201).json({ message: 'Utilizatorul a fost creat cu succes.', user: newUser });
    } catch (error) {
        console.error('Eroare la crearea utilizatorului:', error);
        res.status(500).json({ message: 'A apărut o eroare la crearea utilizatorului.' });
    }
};


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

exports.changePassword = async (req, res) => {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    try {
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });
        }

        if (user.password !== oldPassword) {
            return res.status(401).json({ message: 'Parola veche nu este corectă.' });
        }

        await user.update({ password: newPassword });

        res.status(200).json({ message: 'Parola a fost schimbată cu succes.' });
    } catch (error) {
        console.error('Eroare la schimbarea parolei:', error);
        res.status(500).json({ message: 'A apărut o eroare la schimbarea parolei.' });
    }
};
