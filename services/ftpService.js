const manageFTP = require('../utils/ftpManager');

const uploadGeneratedFile = async (localPath, remotePath) => {
    try {
        const result = await manageFTP('upload', localPath, remotePath);
        console.log(result.message);
    } catch (error) {
        console.error('Eroare la încărcarea fișierului generat pe FTP:', error.message);
    }
};

module.exports = { manageFTP, uploadGeneratedFile };
