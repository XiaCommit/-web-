const mongoose = require("mongoose");
const AccountSchema = new mongoose.Schema(
  {
    coupleId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    account: {
      type: Number,
      required: true,
    },
    accountType: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5],
    },
    date: {
      type: Date,
      required: true,
    },
    remark: {
      type: String,
      default: "", // 默认为空字符串
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // 关联用户模型
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: true, // 自动添加创建时间
      updatedAt: true, // 自动添加更新时间
    },
    versionKey: false, // 移除默认的__v字段
  }
);

const AccountMoudles = mongoose.model("account", AccountSchema, "accounts");
module.exports = AccountMoudles;
