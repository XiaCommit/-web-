const musicMoudles = require("../models/musicMoudles");
const { getCoupleInfo } = require("../utils/coupleUtil");
async function saveMusic(req, res) {
  try {
    const userId = req.user.id;
    const coupleResult = await getCoupleInfo(userId);
    if (coupleResult.code !== "0000") {
      return res.json({
        code: coupleResult.code,
        message: coupleResult.message,
        data: null,
      });
    }
    const coupleId = coupleResult.data;
    const { songid, sizable_cover, songname, author_name, publish_date, time_length, hash } = req.body;
    const newMusic = await musicMoudles.create({
      coupleId,
      songid,
      sizable_cover,
      songname,
      author_name,
      publish_date,
      time_length,
      hash,
      createdBy: userId,
    });
    if (newMusic) {
      return res.json({
        code: "0000",
        message: "保存成功",
        data: newMusic,
      });
    }
  } catch (err) {
    console.error("添加音乐失败:", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误",
      data: null,
    });
  }
}
async function getMusic(req, res) {
  try {
    const userId = req.user.id;
    const coupleResult = await getCoupleInfo(userId);
    if (coupleResult.code !== "0000") {
      return res.json({
        code: coupleResult.code,
        message: coupleResult.message,
        data: null,
      });
    }
    const coupleId = coupleResult.data;
    const music = await musicMoudles.find({ coupleId });
    return res.json({
      code: "0000",
      message: "获取音乐成功",
      data: music,
    });
  } catch (err) {
    console.error("获取音乐失败:", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误",
      data: null,
    });
  }
}
async function deleteMusic(req, res) {
  try {
    const userId = req.user.id;
    const coupleResult = await getCoupleInfo(userId);
    if (coupleResult.code !== "0000") {
      return res.json({
        code: coupleResult.code,
        message: coupleResult.message,
        data: null,
      });
    }
    const coupleId = coupleResult.data;
    const { id } = req.params;
    const deletedMusic = await musicMoudles.findByIdAndDelete(id);
    if (!deletedMusic) {
      return res.json({
        code: "4006",
        message: "未找到该音乐或无权限删除",
        data: null,
      });
    }
    return res.json({
      code: "0000",
      message: "删除音乐成功",
      data: deletedMusic,
    });
  } catch (err) {
    console.error("删除音乐失败:", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误",
      data: null,
    });
  }
}
module.exports = {
  saveMusic,
  getMusic,
  deleteMusic,
};