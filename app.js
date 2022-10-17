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

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
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
        const promises = sub.posts.map(async (post) => {
          const extractionData = await extractText(post.link);
          post.text = extractionData?.text;
          post.summary = extractionData?.summary;
          return post;
        });
        Promise.all(promises).then(() => {
          sub.save();
          console.log("articles extracted and saved");
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
      console.log(`sub: ${sub.name} iteration`);
      const response = await Axios.get(
        `https://www.reddit.com/r/${sub.name}/top/.json`
      );
      // for each post
      response.data.data.children.forEach((post) => {
        // check if post contains link
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
      console.log("here");
      getArticleData();
    });
  } catch (err) {
    console.log(err);
  }
}
cron.schedule("0 */6 * * *", () => {
  updateSubsCollection();
});

app.get("/api/subs", (req, res) => {
  SubsModel.find({}, (err, data) => {
    res.send(data);
  });
});

module.exports = app;
