const fs = require('fs');
const Client = require('ftp');

const ftpConfig = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
};

const manageFTP = async (action, localPath = null, remotePath = null) => {
    return new Promise((resolve, reject) => {
        const client = new Client();

        client.on('ready', () => {
            switch (action) {
                case 'list':
                    client.list(remotePath || '/', (err, list) => {
                        if (err) {
                            client.end();
                            return reject(err);
                        }
                        client.end();
                        resolve(list);
                    });
                    break;

                case 'upload':
                    if (!localPath || !remotePath) {
                        client.end();
                        return reject(new Error('LocalPath și RemotePath sunt necesare pentru upload.'));
                    }
                    client.put(localPath, remotePath, (err) => {
                        if (err) {
                            client.end();
                            return reject(err);
                        }
                        client.end();
                        resolve({message: `Fișierul ${localPath} a fost încărcat la ${remotePath}.`});
                    });
                    break;

                case 'download':
                    if (!localPath || !remotePath) {
                        client.end();
                        return reject(new Error('LocalPath și RemotePath sunt necesare pentru download.'));
                    }
                    client.get(remotePath, (err, stream) => {
                        if (err) {
                            client.end();
                            return reject(err);
                        }
                        stream.once('close', () => client.end());
                        stream.pipe(fs.createWriteStream(localPath));
                        resolve({message: `Fișierul ${remotePath} a fost descărcat la ${localPath}.`});
                    });
                    break;

                case 'delete':
                    if (!remotePath) {
                        client.end();
                        return reject(new Error('RemotePath este necesar pentru delete.'));
                    }
                    client.delete(remotePath, (err) => {
                        if (err) {
                            client.end();
                            return reject(err);
                        }
                        client.end();
                        resolve({message: `Fișierul ${remotePath} a fost șters.`});
                    });
                    break;

                default:
                    client.end();
                    reject(new Error(`Acțiune necunoscută: ${action}`));
            }
        });

        client.on('error', (err) => {
            reject(err);
        });

        client.connect(ftpConfig);
    });
};

module.exports = manageFTP;