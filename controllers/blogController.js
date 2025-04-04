const {BlogArticle} = require('../models');
const Joi = require('joi');
const multer = require('multer');
const fs = require('fs');
const {manageFTP, uploadGeneratedFile} = require('../services/ftpService');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({storage});

const blogSchema = Joi.object({
    title: Joi.string().required(),
    date: Joi.date().required(),
    category: Joi.string().required(),
    content: Joi.string().required(),
});

const generateImageName = (id, title) => {
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${id}_${randomString}_${sanitizedTitle}.jpg`;
};

exports.createArticle = async (req, res) => {
    upload.single('file')(req, res, async (err) => {
        if (err) return res.status(400).json({message: 'Eroare la încărcarea fișierului.', error: err.message});

        console.log("📝 Date primite în request:", req.body);

        const {error} = blogSchema.validate(req.body);
        if (error) return res.status(400).json({message: error.details[0].message});

        const {title, date, category, content} = req.body;
        const file = req.file;

        try {
            const article = await BlogArticle.create({
                title,
                date,
                headerImage: null,
                category,
                content,
            });

            let savedImageName = null;
            if (file) {
                const year = new Date(date).getFullYear();
                savedImageName = generateImageName(article.id, title);
                const remotePath = `/blog/${year}/${savedImageName}`;
                await uploadGeneratedFile(file.path, remotePath);
                fs.unlinkSync(file.path);

                await article.update({headerImage: savedImageName});
            }

            res.status(201).json(article);
        } catch (err) {
            res.status(500).json({message: 'Eroare la crearea articolului.', error: err.message});
        }
    });
};

exports.getArticles = async (req, res) => {
    try {
        const articles = await BlogArticle.findAll({order: [['date', 'DESC']]});
        res.status(200).json(articles);
    } catch (err) {
        res.status(500).json({message: 'Eroare la obținerea articolelor.', error: err.message});
    }
};

exports.getArticle = async (req, res) => {
    const {id} = req.params;
    try {
        const article = await BlogArticle.findByPk(id);
        if (!article) return res.status(404).json({message: 'Articolul nu a fost găsit.'});

        article.views += 1;
        await article.save();
        res.status(200).json(article);
    } catch (err) {
        res.status(500).json({message: 'Eroare la obținerea articolului.', error: err.message});
    }
};

exports.deleteArticle = async (req, res) => {
    const {id} = req.params;
    try {
        const article = await BlogArticle.findByPk(id);
        if (!article) return res.status(404).json({message: 'Articolul nu a fost găsit.'});

        if (article.headerImage) {
            const year = new Date(article.date).getFullYear();
            const oldImagePath = `/blog/${year}/${article.headerImage}`;
            await manageFTP('delete', oldImagePath);
        }

        await article.destroy();
        res.status(200).json({message: 'Articol șters cu succes.'});
    } catch (err) {
        res.status(500).json({message: 'Eroare la ștergerea articolului.', error: err.message});
    }
};

exports.updateArticle = async (req, res) => {
    upload.single('file')(req, res, async (err) => {
        if (err) return res.status(400).json({message: 'Eroare la încărcarea fișierului.', error: err.message});

        const {id} = req.params;
        const {error} = blogSchema.validate(req.body);
        if (error) return res.status(400).json({message: error.details[0].message});

        const {title, date, category, content} = req.body;
        const file = req.file;

        try {
            const article = await BlogArticle.findByPk(id);
            if (!article) return res.status(404).json({message: 'Articolul nu a fost găsit.'});

            let savedImageName = article.headerImage;

            if (file) {
                const year = new Date(date).getFullYear();
                const newImageName = generateImageName(id, title);
                const remotePath = `/assets.onedu.ro/blog/${year}/${newImageName}`;

                if (article.headerImage) {
                    const oldImagePath = `/assets.onedu.ro/blog/${year}/${article.headerImage}`;
                    await manageFTP('delete', oldImagePath);
                }

                await uploadGeneratedFile(file.path, remotePath);
                fs.unlinkSync(file.path);
                savedImageName = newImageName;
            }

            await article.update({title, date, headerImage: savedImageName, category, content});
            res.status(200).json({message: 'Articol actualizat cu succes.', article});
        } catch (err) {
            res.status(500).json({message: 'Eroare la actualizarea articolului.', error: err.message});
        }
    });
};

exports.getPaginatedArticles = async (req, res) => {
    const {page = 1, limit = 10} = req.query;
    try {
        const offset = (page - 1) * limit;
        const {count, rows} = await BlogArticle.findAndCountAll({
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['date', 'DESC']],
        });

        res.status(200).json({
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            articles: rows,
        });
    } catch (err) {
        res.status(500).json({message: 'Eroare la obținerea articolelor paginate.', error: err.message});
    }
};
