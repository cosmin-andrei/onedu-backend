const fs = require('fs');
const ftp = require('basic-ftp');
const logger = require('./logger');

const ftpConfig = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    port: process.env.FTP_PORT,
    secure: true,
    secureOptions: {
        rejectUnauthorized: false,
    }
};

async function manageFTP(action, localPath = null, remotePath = null) {
    const client = new ftp.Client();
    client.ftp.verbose = false;

    try {
        logger.info('Conectare FTP inițiată.', {
            host: ftpConfig.host,
            port: ftpConfig.port,
            secure: ftpConfig.secure
        });

        await client.access({
            host: ftpConfig.host,
            user: ftpConfig.user,
            password: ftpConfig.password,
            port: ftpConfig.port,
            secure: ftpConfig.secure,
            secureOptions: ftpConfig.secureOptions
        });

        logger.info(`FTP conectat cu succes. Execut acțiunea: ${action}`);

        switch (action) {
            case 'list':
                const list = await client.list(remotePath || '/');
                logger.info(`Listare FTP pentru ${remotePath || '/'} efectuată cu succes.`);
                return list;

            case 'upload':
                if (!localPath || !remotePath) {
                    throw new Error('LocalPath și RemotePath sunt necesare pentru upload.');
                }

                if (typeof localPath === 'string' && fs.existsSync(localPath)) {
                    await client.uploadFrom(localPath, remotePath);
                } else {
                    const tempPath = `temp-${Date.now()}.txt`;
                    fs.writeFileSync(tempPath, localPath);
                    await client.uploadFrom(tempPath, remotePath);
                    fs.unlinkSync(tempPath);
                }

                logger.info(`Fișierul a fost încărcat cu succes la: ${remotePath}`);
                return { message: `Fișierul ${remotePath} a fost încărcat cu succes.` };

            case 'download':
                if (!localPath || !remotePath) {
                    throw new Error('LocalPath și RemotePath sunt necesare pentru download.');
                }

                await client.downloadTo(localPath, remotePath);
                logger.info(`Fișierul a fost descărcat de la ${remotePath} în ${localPath}`);
                return { message: `Fișierul ${remotePath} a fost descărcat la ${localPath}.` };

            case 'delete':
                if (!remotePath) {
                    throw new Error('RemotePath este necesar pentru delete.');
                }

                await client.remove(remotePath);
                logger.info(`Fișierul ${remotePath} a fost șters de pe FTP.`);
                return { message: `Fișierul ${remotePath} a fost șters cu succes.` };

            default:
                throw new Error(`Acțiune necunoscută: ${action}`);
        }
    } catch (err) {
        logger.error(`Eroare FTP la acțiunea "${action}"`, {
            error: err.message,
            action,
            localPath,
            remotePath
        });
        throw err;
    } finally {
        client.close();
        logger.info('Conexiunea FTP a fost închisă.');
    }
}

module.exports = manageFTP;
