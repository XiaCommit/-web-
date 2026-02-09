const UserModel = require("../models/UserModels");
/**
 * 生成情侣唯一标识coupleId
 * @param {mongoose.Types.ObjectId} id1 - 第一个用户ID
 * @param {mongoose.Types.ObjectId} id2 - 第二个用户ID
 * @returns {string} 排序后拼接的coupleId
 */
function generateCoupleId(id1, id2) {
  if (!id1 || !id2) {
    throw new Error("ID参数不能为空");
  }
  // 将ObjectId转为字符串
  const str1 = id1.toString();
  const str2 = id2.toString();

  // 按字典序排序并拼接
  const [sortedId1, sortedId2] = str1 < str2 ? [str1, str2] : [str2, str1];
  return `${sortedId1}_${sortedId2}`;
}
async function getCoupleInfo(currentUserId) {
  try {
    const currentUser = await UserModel.findById(currentUserId);
    if (!currentUser) {
      return {
        code: "2002",
        message: "当前用户不存在",
        data: null,
      };
    }
    if (!currentUser.partnerId) {
      return {
        code: "2009",
        message: "伴侣账号不存在或已失效",
        data: null,
      };
    }
    const coupleId = generateCoupleId(currentUser._id, currentUser.partnerId);
    console.log(coupleId);
    return {
      code: "0000",
      message: "获取情侣信息成功",
      data: coupleId,
    };
  } catch (err) {
    console.error("获取情侣信息失败：", err);
    return {
      code: "5000",
      message: "服务器内部错误",
      data: null,
    };
  }
}

module.exports = { generateCoupleId, getCoupleInfo };
