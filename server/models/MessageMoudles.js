const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  coupleId: {
    type: String,
    required: true,
    index: true,
  },
  timestamp: { type: Date, default: Date.now },
  // 同 coupleId 内自增，用于前端排序、去重；旧数据可能无此字段
  sequenceId: { type: Number },
});
const MessageModel = mongoose.model("message", messageSchema);
module.exports = MessageModel;
