var express = require("express");
var router = express.Router();
const SubsModel = require("../models/Subs");

/* GET home page. */

router.get("/", (req, res) => {
  res.redirect("/api/all");
});
router.get("/all", (req, res) => {
  SubsModel.find({}, (err, data) => {
    res.send(data);
  });
});
router.get("/:sub", (req, res) => {
  SubsModel.findOne({ name: req.params.sub }, (err, data) => {
    if (data) {
      res.send(data);
    } else {
      res.json({ message: "sub not found" });
    }
  });
});

module.exports = router;
