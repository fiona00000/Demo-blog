const fs = require("fs")

var posts = new Array()
var categories = new Array()

const initialize = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('./data/posts.json', 'utf8', (err, data) => {
            if (err) {
                reject("unable to read file")
            }
            posts = JSON.parse(data)
            fs.readFile('./data/categories.json', 'utf8', (err, data) => {
                if (err) {
                    reject("unable to read file")
                }
                categories = JSON.parse(data)
                resolve("success!")
            })
        })
    })
}

const getAllPosts = () => {
    return new Promise((resolve, reject) => {
        if (!posts.length) {
            reject("no resolveults returned")
        }
        resolve(posts)
    })
}

const getPublishedPosts = () => {
    return new Promise((resolve, reject) => {
        if (!posts.length) {
            reject("no resolveults returned")
        }
        posts = posts.filter(post => post.published)
        resolve(posts)
    })
}

const getCategories = () => {
    return new Promise((resolve, reject) => {
        if (!categories.length) {
            reject("no resolveults returned")
        }
        resolve(categories)
    })
}

module.exports = { initialize, getAllPosts, getPublishedPosts, getCategories }