const { BlogArticle } = require('../models');
const Joi = require('joi');

const blogSchema = Joi.object({
    title: Joi.string().required(),
    date: Joi.date().required(),
    headerImage: Joi.string().uri().allow(null, ''),
    category: Joi.string().required(),
    content: Joi.string().required(),
});

exports.createArticle = async (req, res) => {
    const { error } = blogSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { title, date, headerImage, category, content } = req.body;

    try {
        const article = await BlogArticle.create({
            title,
            date,
            headerImage,
            category,
            content,
        });

        res.status(201).json(article);
    } catch (err) {
        res.status(500).json({ message: 'Eroare la crearea articolului.', error: err.message });
    }
};

exports.getArticles = async (req, res) => {
    try {
        const articles = await BlogArticle.findAll({
            order: [['date', 'DESC']],
        });
        res.status(200).json(articles);
    } catch (err) {
        res.status(500).json({ message: 'Eroare la obținerea articolelor.', error: err.message });
    }
};

exports.getArticle = async (req, res) => {
    const { id } = req.params;

    try {
        const article = await BlogArticle.findByPk(id);

        if (!article) {
            return res.status(404).json({ message: 'Articolul nu a fost găsit.' });
        }

        article.views += 1;
        await article.save();

        res.status(200).json(article);
    } catch (err) {
        res.status(500).json({ message: 'Eroare la obținerea articolului.', error: err.message });
    }
};

exports.deleteArticle = async (req, res) => {
    const { id } = req.params;

    try {
        const rowsDeleted = await BlogArticle.destroy({ where: { id } });

        if (rowsDeleted === 0) {
            return res.status(404).json({ message: 'Articolul nu a fost găsit.' });
        }

        res.status(200).json({ message: 'Articol șters cu succes.' });
    } catch (err) {
        res.status(500).json({ message: 'Eroare la ștergerea articolului.', error: err.message });
    }
};

exports.updateArticle = async (req, res) => {
    const { id } = req.params;
    const { error } = blogSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { title, date, headerImage, category, content } = req.body;

    try {
        const article = await BlogArticle.findByPk(id);

        if (!article) {
            return res.status(404).json({ message: 'Articolul nu a fost găsit.' });
        }

        await article.update({ title, date, headerImage, category, content });

        res.status(200).json({ message: 'Articol actualizat cu succes.', article });
    } catch (err) {
        res.status(500).json({ message: 'Eroare la actualizarea articolului.', error: err.message });
    }
};

exports.getPaginatedArticles = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        const offset = (page - 1) * limit;
        const { count, rows } = await BlogArticle.findAndCountAll({
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
        res.status(500).json({ message: 'Eroare la obținerea articolelor paginate.', error: err.message });
    }
};
