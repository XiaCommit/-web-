const mongoose = require("mongoose");
const musicSchema = new mongoose.Schema({
  coupleId: {
    type: String,
    required: true,
    index: true,
  },
  songid: {
    type: String,
    required: true,
    index: true,
  },
  sizable_cover: {
    type: String,
    required: true,
    index: true,
  },
  songname: {
    type: String,
    required: true,
    index: true,
  },
  author_name: {
    type: String,
    required: true,
    index: true,
  },
  publish_date: {
    type: Date,
    required: true,
  },
  time_length: {
    type: Number,
    required: true,
    index: true,
  },
  hash: {
    type: String,
    required: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});
const musicMoudles = mongoose.model("music", musicSchema, "music");
module.exports = musicMoudles;