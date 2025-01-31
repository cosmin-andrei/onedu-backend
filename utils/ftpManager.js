const fs = require('fs');
const ftp = require('basic-ftp');

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
    client.ftp.verbose = true;

    try {
        console.log('Încerc să mă conectez la FTP cu:', {
            ...ftpConfig,
            user: '***hidden***',
            password: '***hidden***'
        });

        await client.access({
            host: ftpConfig.host,
            user: ftpConfig.user,
            password: ftpConfig.password,
            port: ftpConfig.port,
            secure: ftpConfig.secure,
            secureOptions: ftpConfig.secureOptions
        });

        switch (action) {
            case 'list':
                return await client.list(remotePath || '/');
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
                return { message: `Fișierul ${remotePath} a fost încărcat cu succes.` };

            case 'download':
                if (!localPath || !remotePath) {
                    throw new Error('LocalPath și RemotePath sunt necesare pentru download.');
                }
                await client.downloadTo(localPath, remotePath);
                return { message: `Fișierul ${remotePath} a fost descărcat la ${localPath}.` };

            case 'delete':
                if (!remotePath) {
                    throw new Error('RemotePath este necesar pentru delete.');
                }
                await client.remove(remotePath);
                return { message: `Fișierul ${remotePath} a fost șters cu succes.` };

            default:
                throw new Error(`Acțiune necunoscută: ${action}`);
        }
    } catch (err) {
        console.error('Eroare FTP:', err.message);
        throw err;
    } finally {
        client.close();
    }
}

module.exports = manageFTP;
