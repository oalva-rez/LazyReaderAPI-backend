const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const Axios = require("axios");
require("dotenv").config();
const cron = require("node-cron");
const SubsModel = require("./models/Subs");
const extractText = require("./textExtractor");
const { log } = require("console");
const app = express();

mongoose.connect(
  `mongodb+srv://ozkaralvarez98:${process.env.DB_PWD}@cluster0.7rrgp4l.mongodb.net/Subreddits?retryWrites=true&w=majority`
);

const apiRouter = require("./routes/api");

app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

async function getArticleData() {
  try {
    // extract text from each post link and save it in the database
    const data = await SubsModel.find({});
    data.forEach((sub) => {
      // create array of promises from each post updated
      const promises = sub.posts.map(async (post) => {
        if (post.text === "" && post.summary?.length === 0) {
          const extractionData = await extractText('"' + post.link + '"');
          post.text = extractionData?.text;
          post.summary = extractionData?.summary;
          return post;
        }
      });
      // wait for all promises to resolve and save the sub DB
      Promise.all(promises).then(() => {
        sub.save();
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
              summary: [],
            });
          }
        }
      });
      // save the sub
      await sub.save();
    });
    Promise.all(promises).then(() => {
      console.log("Subs updated");
      getArticleData();
    });
  } catch (err) {
    console.log(err);
  }
}

// -----------------NO UPDATE-----------------

// CURRENTLY NOT UDPDATING DUE TO API LIMITS

// update the database every 6 hours
// cron.schedule("0 */6 * * *", () => {
// updateSubsCollection();
// });

// -----------------NO UPDATE-----------------

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
