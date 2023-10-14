const express = require("express");
const mongodb = require("mongodb");

const db = require("../data/database");

const ObjectId = mongodb.ObjectId;

const router = express.Router();

// Pagina Principal
router.get("/", function (req, res) {
  res.redirect("/posts");
});

// Mostra a lista de Posts do Blog
router.get("/posts", async function (req, res) {
  const posts = await db
    .getDb()
    .collection("posts")
    .find({})
    .project({ title: 1, summary: 1, "author.name": 1 })
    .toArray();

  res.render("posts-list", { posts: posts });
});

// Formulário de escrever novos posts
router.get("/new-post", async function (req, res) {
  const authors = await db.getDb().collection("authors").find().toArray();
  res.render("create-post", { authors: authors });
});

// Envio do formulário de novo post
router.post("/posts", async function (req, res) {
  const authorId = new ObjectId(req.body.author);
  const author = await db
    .getDb()
    .collection("authors")
    .findOne({ _id: authorId });

  const newPost = {
    title: req.body.title,
    summary: req.body.summary,
    body: req.body.content,
    date: new Date(),
    author: {
      id: authorId,
      name: author.name,
      email: author.email,
    },
  };

  const result = await db.getDb().collection("posts").insertOne(newPost);
  res.redirect("/posts");
});

router.get("/posts/:id", async function (req, res, next) {
  postId = req.params.id;

  try {
    postId = new ObjectId(req.params.id);
  } catch (error) {
    res.status("404").render("404");
    // return next(error);
  }

  const thisPost = await db
    .getDb()
    .collection("posts")
    .findOne({ _id: postId }, { summary: 0 });

  if (!thisPost) return res.status(404).render("404");

  thisPost.humanReadable = thisPost.date.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  thisPost.date = thisPost.date.toISOString();

  res.render("post-detail", { post: thisPost });
});

router.get("/posts/:id/edit", async function (req, res) {
  postId = new ObjectId(req.params.id);

  const thisPost = await db
    .getDb()
    .collection("posts")
    .findOne({ _id: postId });

  if (!thisPost) return res.status(404).render("404");

  res.render("update-post", { post: thisPost });
});

router.post("/posts/:id/edit", async function (req, res) {
  postId = new ObjectId(req.params.id);

  const query = await db
    .getDb()
    .collection("posts")
    .updateOne(
      { _id: postId },
      {
        $set: {
          title: req.body.title,
          summary: req.body.summary,
          body: req.body.content,
          date: new Date(),
        },
      }
    );

  res.redirect("/posts");
});

router.post("/posts/:id/delete", async function (req, res) {
  postId = new ObjectId(req.params.id);

  const query = await db.getDb().collection("posts").deleteOne({ _id: postId });

  res.redirect("/posts");
});

module.exports = router;
