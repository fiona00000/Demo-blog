require('dotenv').config()
const express = require("express")
const multer = require("multer")
const cloudinary = require("cloudinary").v2
const streamifier = require("streamifier")
const blogService = require("./blog-service")
const authData = require("./auth-service")
const path = require("path")
const stripJs = require("strip-js")
const exphbs = require("express-handlebars")
const clientSessions = require("client-sessions")

const HTTP_PORT = process.env.PORT || 8080
const app = express()

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: (url, options) => {
        return (
          "<li" +
          (url == app.locals.activeRoute ? ' class="active" ' : "") +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        )
      },
      equal: (lvalue, rvalue, options) => {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters")
        if (lvalue != rvalue) {
          return options.inverse(this)
        } else {
          return options.fn(this)
        }
      },
      safeHTML: (context) => {
        return stripJs(context);
      },
      formatDate: (dateObj) => {
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString()
        let day = dateObj.getDate().toString()
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      },
    },
  })
)
app.set("view engine", ".hbs")

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

const upload = multer()

const onHttpStart = () => {
  console.log(`Express http server listening on ${HTTP_PORT} :)`)
}

const ensureLogin = (req, res, next) => {
  if (!req.session.user) {
    res.redirect("/login")
  } else {
    next()
  }
}

app.use(express.urlencoded({ extended: true }))

app.use(express.static("public"), (req, res, next) => {
  let route = req.path.substring(1)
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""))
  app.locals.viewingCategory = req.query.category
  next()
})

app.use(express.static("static"))

app.use(clientSessions({
  cookieName: "session",
  secret: process.env.CLIENT_SESSION_SECRET,
  duration: 2 * 60 * 1000,
  activeDuration: 1000 * 60
}))

app.use(express.urlencoded({ extended: false }))

app.use((req, res, next) => {
  res.locals.session = req.session
  next()
})

app.get("/", (req, res) => {
  res.redirect("/blog")
})

app.get("/about", (req, res) => {
  res.render("about", { layout: "./main.hbs" })
})

app.get("/blog", async (req, res) => {
  let viewData = {}

  try {
    let posts = []

    if (req.query.category) {
      posts = await blogService.getPublishedPostsByCategory(req.query.category)
    } else {
      posts = await blogService.getPublishedPosts()
    }

    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate))

    let post = posts[0]

    viewData.posts = posts
    viewData.post = post
  } catch (err) {
    viewData.message = "no results"
  }

  try {
    let categories = await blogService.getCategories()

    viewData.categories = categories
  } catch (err) {
    viewData.categoriesMessage = "no results"
  }
  res.render("blog", { data: viewData })
})

app.get("/blog/:id", async (req, res) => {
  let viewData = {}

  try {
    let posts = []

    if (req.query.category) {
      posts = await blogService.getPublishedPostsByCategory(req.query.category)
    } else {
      posts = await blogService.getPublishedPosts()
    }

    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate))

    viewData.posts = posts
  } catch (err) {
    viewData.message = "no results"
  }

  try {
    viewData.post = await blogService.getPostById(req.params.id)
  } catch (err) {
    viewData.message = "no results"
  }

  try {
    let categories = await blogService.getCategories()

    viewData.categories = categories
  } catch (err) {
    viewData.categoriesMessage = "no results"
  }

  res.render("blog", { data: viewData })
})

app.get("/posts", ensureLogin, (req, res) => {
  var category = req.query.category
  var minDate = req.query.minDate
  if (category) {
    blogService
      .getPostsByCategory(category)
      .then((data) => {
        if (!data.length) res.render("posts", { message: "no results" })
        res.render("posts", { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      })
  } else if (minDate) {
    blogService
      .getPostsByMinDate(minDate)
      .then((data) => {
        if (!data.length) res.render("posts", { message: "no results" })
        res.render("posts", { posts: data })
      })
      .catch((err) => {
        res.render("posts", { message: "no results" })
      })
  } else {
    blogService
      .getAllPosts()
      .then((data) => {
        if (!data.length) res.render("posts", { message: "no results" })
        res.render("posts", { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" })
      })
  }
})

app.get("/post/:value", ensureLogin, (req, res) => {
  var val = req.params.value
  blogService
    .getPostById(val)
    .then((posts) => res.json(posts))
    .catch((err) => {
      res.json({ message: "no results" })
    })
})

app.get("/posts/add", ensureLogin, (req, res) => {
  blogService
    .getCategories()
    .then((data) => {
      res.render("addPost", { categories: data })
    })
    .catch((err) => {
      res.render("addPost", { categories: [] })
    })
})

app.post("/posts/add", ensureLogin, upload.single("featureImage"), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result)
          } else {
            reject(error)
          }
        })

        streamifier.createReadStream(req.file.buffer).pipe(stream)
      })
    }

    async function upload(req) {
      let result = await streamUpload(req)
      console.log(result)
      return result
    }

    upload(req).then((uploaded) => {
      processPost(uploaded.url)
    })
  } else {
    processPost("")
  }
  const processPost = (imageUrl) => {
    req.body.featureImage = imageUrl
    let postData = {
      body: req.body.body,
      title: req.body.title,
      postDate: new Date(),
      category: req.body.category,
      featureImage: imageUrl,
      published: req.body.published,
    }

    blogService
      .addPost(postData)
      .then(res.redirect("/posts"))
      .catch((err) => {
        console.log(err)
        res.json({ message: "no results" })
      })
  }
})

app.get("/posts/delete/:id", ensureLogin, (req, res) => {
  const id = req.params.id
  blogService
    .deletePostById(id)
    .then(res.redirect("/posts"))
    .catch((err) => {
      res.status(500).send("Unable to Remove Post / Post not found)")
    })
})

app.get("/categories", ensureLogin, (req, res) => {
  blogService.getCategories()
    .then((data) => {
      if (!data.length) res.render("categories", { message: "no results" })
      res.render("categories", { categories: data })
    })
    .catch((err) => {
      res.render("categories", { message: "no results" })
    })
})

app.get("/categories/add", ensureLogin, (req, res) => {
  res.render("addCategory")
})

app.post("/categories/add", ensureLogin, (req, res) => {
  let cateData = {
    category: req.body.category
  }

  var categoryData = { category: req.body.category }
  blogService.addCategory(categoryData)
    .then(() => {
      res.redirect("/categories")
    })
    .catch((err) => {
      console.log(err)
    })
})

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  const id = req.params.id;
  blogService
    .deleteCategoryById(id)
    .then(res.redirect("/categories"))
    .catch((err) => {
      res.status(500).send("Unable to Remove Category / Category not found)")
    })
})

app.get("/register", (req, res) => {
  res.render("register")
})

app.post("/register", (req, res) => {
  authData.registerUser(req.body)
    .then(() => {
      res.render("register", { successMessage: "User created" })
    })
    .catch(err => {
      res.render("register", { errorMessage: err, userName: req.body.userName })
    })
})

app.get("/login", (req, res) => {
  res.render("login")
})

app.post("/login", (req, res) => {
  req.body.userAgent = req.get('User-Agent')
  authData.checkUser(req.body).then((user) => {
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory
    }
    res.redirect('/posts')
  })
    .catch(err => {
      res.render("login", { errorMessage: err, userName: req.body.userName })
    })
})

app.get("/logout", (req, res) => {
  req.session.reset()
  res.redirect('/')
})

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory")
})

app.get("*", function (req, res) {
  res.status(404).render("notFound")
})

blogService
  .initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(HTTP_PORT, onHttpStart)
  })
  .catch((err) => {
    console.log(err)
  })