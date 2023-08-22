const express = require("express")
const multer = require("multer")
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const blogService = require("./blog-service")
const path = require('path')

const HTTP_PORT = process.env.PORT || 8080
const app = express()

app.use(express.static('public'));

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true
});

const upload = multer();

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
	var category = req.query.category;
	var minDate = req.query.minDate;
	if (category) {
		blogService.getPostsByCategory(category)
			.then((posts) =>
				res.json(posts)
			)
			.catch((err) => {
				res.json({ message: "no results" })
			})
	} else if (minDate) {
		blogService.getPostsByMinDate(minDate)
			.then((posts) =>
				res.json(posts)
			)
			.catch((err) => {
				res.json({ message: "no results" })
			})
	} else {
		blogService.getAllPosts()
			.then((posts) =>
				res.json(posts)
			)
			.catch((err) => {
				res.json({ message: "no results" })
			})
	}
})

app.get("/post/:value", (req, res) => {
	var val = req.params.value;
	blogService.getPostById(val)
		.then((posts) =>
			res.json(posts)
		)
		.catch((err) => {
			res.json({ message: "no results" })
		})
})

app.get("/categories", (req, res) => {
	blogService.getCategories()
		.then((categories) =>
			res.json(categories)
		)
		.catch((err) => {
			res.json({ err })
		})
})

app.get("/posts/add", (req, res) => {
	res.sendFile(path.join(__dirname, "/views/addPost.html"))
})

app.post("/posts/add", upload.single("featureImage"), (req, res) => {
	if (req.file) {
		let streamUpload = (req) => {
			return new Promise((resolve, reject) => {
				let stream = cloudinary.uploader.upload_stream(
					(error, result) => {
						if (result) {
							resolve(result);
						} else {
							reject(error);
						}
					}
				);

				streamifier.createReadStream(req.file.buffer).pipe(stream);
			});
		};

		async function upload(req) {
			let result = await streamUpload(req);
			console.log(result);
			return result;
		}

		upload(req).then((uploaded) => {
			processPost(uploaded.url);
		});
	} else {
		processPost("");
	}
	function processPost(imageUrl) {
		req.body.featureImage = imageUrl;

		let title = req.body.title;
		let body = req.body.body;
		let category = req.body.category;
		let published = req.body.published;
		let postData = {
			"body": body,
			"title": title,
			"postDate": new Date().toDateString(),
			"category": category,
			"featureImage": imageUrl,
			"published": published
		};

		blogService.addPost(postData).then(
			res.redirect('/posts')
		).catch((err) => {
			res.json({ message: "no results" })
		})
	}
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
