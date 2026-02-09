const mongoose = require("mongoose");

let UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  gender: {
    type: String,
    required: true,
    enum: ["1", "2"],
  },
  birthday: {
    type: Date,
    required: true,
  },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  partnerInviteCode: {
    type: String,
    default: null,
  },
});

let UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;
