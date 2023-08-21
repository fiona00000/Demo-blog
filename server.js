
const express = require("express")
const blogService = require("./blog-service")
const path = require('path')

const HTTP_PORT = process.env.PORT || 8080
const app = express()

app.use(express.static('public'));

function onHttpStart() {
	console.log(`Express http server listening on ${HTTP_PORT}`)
}

app.get("/", function (req, res) {
	res.redirect('/about')
});

app.get("/about", function (req, res) {
	res.sendFile(path.join(__dirname, "/views/about.html"))
})

app.get("/blog", (req, res) => {
	blogService.getPublishedPosts()
		.then((posts) =>
			res.json(posts)
		)
		.catch((err) => {
			res.send(err)
		})
})

app.get("/posts", (req, res) => {
	blogService.getAllPosts()
		.then((posts) =>
			res.json(posts)
		)
		.catch((err) => {
			res.send(err)
		})
})

app.get("/categories", (req, res) => {
	blogService.getCategories()
		.then((categories) =>
			res.json(categories)
		)
		.catch((err) => {
			res.send(err)
		})
})

app.get("*", function (req, res) {
	res.status(404).sendFile(path.join(__dirname, "/views/notFound.html"))
})

blogService.initialize()
	.then(() => {
		app.listen(HTTP_PORT, onHttpStart)
	}
	)
	.catch((err) => {
		console.log(err)
	})
