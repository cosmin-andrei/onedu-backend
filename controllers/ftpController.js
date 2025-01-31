const manageFTP = require('../utils/ftpManager');

exports.listFiles = async (req, res) => {
    const { path } = req.query;

    try {
        const files = await manageFTP("list", null, path || "/");
        res.status(200).json({ message: "Fișiere listate cu succes.", files });
    } catch (error) {
        console.error("Eroare la listarea fișierelor:", error);
        res.status(500).json({ message: "A apărut o eroare la listarea fișierelor." });
    }
};

exports.uploadFile = async (req, res) => {
    const { remotePath } = req.body;

    try {
        if (!req.file) {
            return res.status(400).json({ message: "Nu s-a încărcat niciun fișier." });
        }

        const localPath = req.file.path;
        await manageFTP("upload", localPath, remotePath);
        res.status(200).json({ message: "Fișier încărcat cu succes pe serverul FTP." });
    } catch (error) {
        console.error("Eroare la încărcarea fișierului:", error);
        res.status(500).json({ message: "A apărut o eroare la încărcarea fișierului." });
    }
};

exports.downloadFile = async (req, res) => {
    const { remotePath, localPath } = req.body;

    try {
        await manageFTP("download", localPath, remotePath);
        res.status(200).json({ message: "Fișier descărcat cu succes." });
    } catch (error) {
        console.error("Eroare la descărcarea fișierului:", error);
        res.status(500).json({ message: "A apărut o eroare la descărcarea fișierului." });
    }
};

exports.deleteFile = async (req, res) => {
    const { remotePath } = req.body;

    try {
        await manageFTP("delete", null, remotePath);
        res.status(200).json({ message: "Fișier șters cu succes de pe serverul FTP." });
    } catch (error) {
        console.error("Eroare la ștergerea fișierului:", error);
        res.status(500).json({ message: "A apărut o eroare la ștergerea fișierului." });
    }
};
