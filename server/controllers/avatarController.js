const AvatarMoudles = require('../models/AvatarMoudles');
async function getAvatar(req, res) {
    try {
        const userId = req.user.id;
        const avatar = await AvatarMoudles.findOne({ userId });
        if (avatar) {
            return res.json({
                code: "0000",
                message: "获取成功",
                data: avatar,
            });
        } else {
            // 用户还没有头像时返回空数据
            return res.json({
                code: "2004",
                message: "暂无头像记录",
                data: null,
            });
        }
    } catch (err) {
        console.error("获取头像失败", err);
        return res.json({
            code: "5000",
            message: "服务器内部错误",
            data: null,
        });
    }
}
async function uploadAvatar(req, res) {
  try {
    const userId = req.user.id;
    const { avatar } = req.body;
    
    let existingAvatar = await AvatarMoudles.findOne({ userId });
    
    if (existingAvatar) {
      existingAvatar.avatar = avatar;
      await existingAvatar.save();
      return res.json({
        code: "0000",
        message: "更新头像成功",
        data: existingAvatar,
      });
    } else {
      // 如果不存在，创建新记录
      const newAvatar = await AvatarMoudles.create({
        userId,
        avatar,
      });
      return res.json({
        code: "0000",
        message: "上传头像成功",
        data: newAvatar,
      });
    }
  } catch (err) {
    console.error("上传头像失败", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误",
      data: null,
    });
  }
}

module.exports = { uploadAvatar, getAvatar };