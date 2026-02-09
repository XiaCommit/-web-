const MessageModel = require("../models/MessageMoudles");
const { getCoupleInfo } = require("../utils/coupleUtil");
async function getMessage(req, res) {
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
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const size = Math.min(100, Math.max(1, parseInt(String(req.query.size), 10) || 20));
    const skip = (page - 1) * size;
    const limit = size;

    const total = await MessageModel.countDocuments({ coupleId });
    // 聊天消息显示：最新消息在底部，向上滚动加载更旧的消息
    // 第1页应该返回最新的20条消息，顺序为 [第20新, ..., 最新]（最新的在末尾）
    // 策略：按 sequenceId 升序排序，从后往前取最新的消息
    let actualSkip = 0;
    
    // 计算应该跳过多少条旧消息
    // 第1页：取最后20条，skip = total - 20（如果 total > 20）
    // 第2页：取更旧的20条，skip = total - 40
    // 第3页：取更旧的20条，skip = total - 60
    if (total > limit) {
      // 从后往前取：第1页取最后20条，第2页取倒数21-40条，以此类推
      actualSkip = Math.max(0, total - (page * limit));
      // 确保不超过总数
      if (actualSkip + limit > total) {
        actualSkip = Math.max(0, total - limit);
      }
    } else {
      // 如果消息总数小于等于每页数量，第1页返回所有，其他页返回空
      actualSkip = page === 1 ? 0 : total;
    }
    
    const messages = await MessageModel.find({ coupleId })
      .sort({ sequenceId: 1, timestamp: 1 }) // 升序：旧消息在前，新消息在后
      .skip(actualSkip)
      .limit(limit)
      .lean();

    // 直接使用升序结果，顺序为 [旧消息, ..., 新消息]，最新消息在列表末尾（显示在底部）
    const list = messages.map((m) => ({
      _id: m._id.toString(),
      content: m.content,
      from: m.from.toString(),
      to: m.to.toString(),
      timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
      sequenceId: m.sequenceId,
    }));

    return res.json({
      code: "0000",
      message: "获取消息成功",
      data: {
        messages: list,
        total,
        page,
        size,
        hasMore: actualSkip > 0, // 如果还有更旧的消息（skip > 0），说明还有更多
      },
    });
  } catch (err) {
    console.error("获取消息失败", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误",
      data: null,
    });
  }
}
module.exports = { getMessage };