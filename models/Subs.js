const mongoose = require("mongoose");

const PostsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: false,
  },
  summary: {
    type: Array,
    required: false,
  },
  upvotes: {
    type: Number,
    required: false,
  },
  thumbnail: {
    type: String,
    required: false,
  },
});

const SubsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  posts: [PostsSchema],
});

const SubsModel = mongoose.model("subs", SubsSchema);
module.exports = SubsModel;
