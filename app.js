var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const Axios = require("axios");
require("dotenv").config();
var cron = require("node-cron");
const extractText = require("./textExtractor");

mongoose.connect(
  "mongodb+srv://ozkaralvarez98:MUEwu6FihlSxCYku@cluster0.7rrgp4l.mongodb.net/Subreddits?retryWrites=true&w=majority"
);
const SubsModel = require("./models/Subs");

var apiRouter = require("./routes/api");

const { log } = require("console");

var app = express();

app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

function getArticleData() {
  try {
    // extract text from each post link and save it in the database
    SubsModel.find({}, (err, data) => {
      data.forEach((sub) => {
        // create array of promises from each post updated
        const promises = sub.posts.map(async (post) => {
          const extractionData = await extractText(post.link);
          post.text = extractionData?.text;
          post.summary = extractionData?.summary;
          return post;
        });
        // wait for all promises to resolve and save the sub DB
        Promise.all(promises).then(() => {
          sub.save();
        });
      });
    });
  } catch (err) {
    console.log(err);
  }
}

async function updateSubsCollection() {
  try {
    const data = await SubsModel.find({});

    // for each sub
    const promises = data.map(async (sub) => {
      // get the posts
      const response = await Axios.get(
        `https://www.reddit.com/r/${sub.name}/top/.json`
      );
      // for each post
      response.data.data.children.forEach((post) => {
        // check if post is self (text post)
        if (!post.data.is_self) {
          // check if the post is already in the database
          let found = false;
          sub.posts.forEach((subPost) => {
            if (subPost.title === post.data.title) {
              found = true;
            }
          });
          // if the post is not in the database
          if (!found) {
            // add the post to the database
            sub.posts.push({
              title: post.data.title,
              link: post.data.url,
              text: "",
              summary: "",
            });
          }
        }
      });
      // save the sub
      await sub.save();
    });
    Promise.all(promises).then(() => {
      getArticleData();
    });
  } catch (err) {
    console.log(err);
  }
}

// update the database every 6 hours
cron.schedule("0 */6 * * *", () => {
  updateSubsCollection();
});

app.use("/api", apiRouter);

app.get("/", (req, res) => {
  res.redirect("/api/all");
});

app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});
module.exports = app;
