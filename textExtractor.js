const axios = require("axios");
require("dotenv").config();

const extractText = (link) => {
  const options = {
    method: "POST",
    url: "https://news-article-data-extract-and-summarization1.p.rapidapi.com/extract/",
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": process.env.API_KEY,
      "X-RapidAPI-Host":
        "news-article-data-extract-and-summarization1.p.rapidapi.com",
    },
    data: `{"url":${link}}`,
  };
  return axios
    .request(options)
    .then(function (response) {
      const text = response.data?.text;
      const summary = response.data?.summary;
      return { text, summary };
    })
    .catch(function (error) {
      console.error(error);
    });
};

module.exports = extractText;
