const fs = require("fs")

let posts = new Array()
let categories = new Array()

const initialize = () => {
    return new Promise((res, rej) => {
        fs.readFile('./data/posts.json', 'utf8', (err, data) => {
            if (err) {
                rej("unable to read file")
            }
            posts = JSON.parse(data)
            fs.readFile('./data/categories.json', 'utf8', (err, data) => {
                if (err) {
                    rej("unable to read file")
                }
                categories = JSON.parse(data)
                res("success!")
            })
        })
    })
}

const getAllPosts = () => {
    return new Promise((res, rej) => {
        if (!posts.length) {
            rej("no results returned")
        }
        res([posts])
    })
}

const getPublishedPosts = () => {
    let publishedPosts = new Array();
    return new Promise((res, rej) => {
        if (!publishedPosts.length) {
            rej("no results returned")
        }
        publishedPosts = posts.filter(post => post.published)
        res(publishedPosts)
    })
}

const getCategories = () => {
    return new Promise((res, rej) => {
        if (!categories.length) {
            rej("no results returned")
        }
        res(categories)
    })
}

const addPost = (postData) => {
    return new Promise((res, rej) => {
        if (postData.published == null) {
            postData.published = false;
        } else {
            postData.published = true;
        }

        postData.id = posts.length + 1;
        posts.push(postData);
        res(posts)
    })
}

const getPostsByCategory = (category) => {
    let categoryPosts = new Array();
    return new Promise((res, rej) => {
        categoryPosts = posts.filter(post => post.category == category)
        if (!categoryPosts.length) {
            rej("no results returned")
        }
        res(categoryPosts)
    })
}

const getPostsByMinDate = (minDateStr) => {
    let datePosts = new Array();
    return new Promise((res, rej) => {
        datePosts = posts.filter(post => new Date(post.postDate) >= new Date(minDateStr))
        if (!datePosts.length) {
            rej("no results returned")
        }
        res(datePosts)
    })
}

const getPostById = (id) => {
    let idPosts = new Array();
    return new Promise((res, rej) => {
        idPosts = posts.filter(post => post.id == id)
        if (!idPosts.length) {
            rej("no results returned")
        }
        res(idPosts)
    })
}

module.exports = { initialize, getAllPosts, getPublishedPosts, getCategories, addPost, getPostsByCategory, getPostsByMinDate, getPostById }