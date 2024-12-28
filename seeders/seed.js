// backend/seeders/seed.js
const { sequelize, User, Administrator } = require('../models');

async function seed() {
    try {
        await sequelize.sync({ force: true });

        const user = await User.create({
            first_name: 'Admin',
            last_name: 'OnEdu',
            email: 'admin@onedu.com',
            telefon: '1234567890'
        });

        await Administrator.create({ userId: user.id });

        console.log('Baza de date a fost populată.');
        process.exit();
    } catch (error) {
        console.error('Eroare la popularea bazei de date:', error);
        process.exit(1);
    }
}

seed();
