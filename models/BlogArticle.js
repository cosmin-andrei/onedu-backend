module.exports = (sequelize, DataTypes) => {
    return sequelize.define('BlogArticle', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        headerImage: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        views: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    }, {
        tableName: 'blog_articles',
        timestamps: false,
    });
};
