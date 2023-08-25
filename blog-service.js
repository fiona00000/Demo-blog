require('dotenv').config()
const Sequelize = require('sequelize');
var sequelize = new Sequelize(process.env.POSTGRES_DB, process.env.POSTGRES_DB, process.env.POSTGRES_PASSWORD, {
    host: process.env.POSTGRES_HOST,
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

var Post = sequelize.define('Post', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
})
var Category = sequelize.define('Category', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    category: Sequelize.STRING
})
Post.belongsTo(Category, { foreignKey: 'category' })

const initialize = () => {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => {
                resolve("Sync success!")
            })
            .catch((err) => {
                reject("unable to sync the database");
            })
    });
}

const getAllPosts = () => {
    return new Promise((resolve, reject) => {
        Post.findAll()
            .then((data) => {
                if (!data.length)
                    reject("no results returned")
                resolve(data)
            })
            .catch((err) => {
                reject("no results returned");
            })
    });
}

const getPublishedPosts = () => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                published: true
            }
        })
            .then((data) => {
                if (!data.length)
                    reject("no results returned")
                resolve(data)
            })
            .catch((err) => {
                reject("no results returned");
            })
    });
}

const addPost = (postData) => {
    postData.published = (postData.published) ? true : false;
    for (let item in postData) {
        if (postData[item] === "")
            postData[item] = null
    }
    postData.postDate = new Date();
    return new Promise((resolve, reject) => {
        Post.create(postData)
            .then(() => {
                resolve(postData)
            })
            .catch((err) => {
                reject("unable to create post")
            })
    });
}

const getPostsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                category: category
            }
        })
            .then((data) => {
                if (!data.length)
                    reject("no results returned")
                resolve(data)
            })
            .catch((err) => {
                reject("no results returned");
            })
    });
}

const getPostsByMinDate = (minDateStr) => {
    return new Promise((resolve, reject) => {
        const { gte } = Sequelize.Op;
        Post.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        })
            .then((data) => {
                if (!data.length)
                    reject("no results returned")
                resolve(data)
            })
            .catch((err) => {
                reject("no results returned");
            })
    });
}

const getPostById = (id) => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                id: id
            }
        })
            .then((data) => {
                if (!data.length)
                    reject("no results returned")
                resolve(data[0])
            })
            .catch((err) => {
                reject("no results returned");
            })
    });
}

const getPublishedPostsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                published: true,
                category: category
            }
        })
            .then((data) => {
                if (!data.length)
                    reject("no results returned")
                resolve(data)
            })
            .catch((err) => {
                reject("no results returned");
            })
    });
}

const deletePostById = (id) => {
    return new Promise((resolve, reject) => {
        Post.destroy({
            where: {
                id: id
            }
        })
            .then((posts) =>
                resolve(posts + " destroyed")
            )
            .catch((err) => {
                reject("destroy failed");
            })
    })
}

const getCategories = () => {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then((data) => {
                if (!data.length)
                    reject("no results returned")
                resolve(data)
            })
            .catch((err) => {
                reject("no results returned");
            })
    });
}

const addCategory = (categoryData) => {
    for (item in categoryData) {
        item.category = item.category === "" ? null : item.category
    }
    return new Promise((resolve, reject) => {
        Category.create(categoryData)
            .then((categoryData) => {
                resolve(categoryData)
            })
            .catch((err) => {
                reject("unable to create category")
            })
    })
}

const deleteCategoryById = (id) => {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: {
                id: id
            }
        })
            .then((category) =>
                resolve(category + " destroyed")
            )
            .catch((err) => {
                reject("destroy failed");
            })
    })
}

module.exports = {
    initialize, getAllPosts, getPublishedPosts, addPost, getPostsByCategory, getPostsByMinDate, getPostById, getPublishedPostsByCategory, deletePostById, getCategories, addCategory, deleteCategoryById,
}