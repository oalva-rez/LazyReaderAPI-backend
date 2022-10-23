const axios = require("axios");
require("dotenv").config();

const extractText = (link) => {
  const encodedParams = new URLSearchParams();
  encodedParams.append("language", "english");
  encodedParams.append("url", link);

  const options = {
    method: "POST",
    url: "https://text-analysis12.p.rapidapi.com/article-extraction/api/v1.3",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "X-RapidAPI-Key": process.env.API_KEY,
      "X-RapidAPI-Host": "text-analysis12.p.rapidapi.com",
    },
    data: encodedParams,
  };

  return axios
    .request(options)
    .then(function (response) {
      const text = response.data.article?.text;
      const summary = response.data.article?.summary;
      return { text, summary };
    })
    .catch(function (error) {
      console.error(error);
    });
};

module.exports = extractText;
