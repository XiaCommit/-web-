const mongoose = require("mongoose");
const MeetDateSchema = new mongoose.Schema({
  coupleId: {
    type: String,
    required: true,
    index: true,
  },
  meetDate: {
    type: Date,
    required: true,
    default: null,
  },
});
const MeetDateMoudles = mongoose.model("meetDate", MeetDateSchema, "meetDates");
module.exports = MeetDateMoudles;