const MeetDateMoudles = require("../models/MeetDateMoudles");
const { getCoupleInfo } = require("../utils/coupleUtil");
async function saveMeetDate(req, res) {
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
    const { meetDate } = req.body;
    let parsedDate = null;
    let match = null;
    if (
      typeof meetDate === "string" &&
      meetDate.includes("年") &&
      meetDate.includes("月") &&
      meetDate.includes("日")
    ) {
      match = meetDate.match(/(\d+)年(\d+)月(\d+)日/);
      if (match) {
        const [, year, month, day] = match;
        parsedDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
      } else {
        return res.json({
          code: "4002",
          message: "日期格式不正确，请使用YYYY年MM月DD日格式",
          data: null,
        });
      }
    } else {
      parsedDate = new Date(meetDate);
    }

    // 先查找是否已存在相识日期
    let existingMeetDate = await MeetDateMoudles.findOne({ coupleId });

    if (existingMeetDate) {
      // 如果存在，使用 save() 方法更新
      existingMeetDate.meetDate = parsedDate;
      await existingMeetDate.save();
      return res.json({
        code: "0000",
        message: "更新相识日期成功",
        data: existingMeetDate,
      });
    } else {
      // 如果不存在，使用 save() 方法创建新文档
      const newMeetDate = new MeetDateMoudles({
        coupleId,
        meetDate: parsedDate,
      });
      await newMeetDate.save();
      return res.json({
        code: "0000",
        message: "新增相识日期成功",
        data: newMeetDate,
      });
    }
  }
  catch (err) {
    console.error("保存相识日期失败:", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误: " + err.message,
      data: null,
    });
  }
}
async function getMeetDate(req, res) {
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
    const meetDate = await MeetDateMoudles.findOne({ coupleId });
    if (meetDate) {
      return res.json({
        code: "0000",
        message: "获取相识日期成功",
        data: meetDate,
      });
    }
    // 没有相识日期记录时也要及时返回，避免请求超时
    return res.json({
      code: "2004",
      message: "暂无相识日期记录",
      data: null,
    });
  }
  catch (err) {
    console.error("获取相识日期失败:", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误: " + err.message,
      data: null,
    });
  }
}

module.exports = { saveMeetDate, getMeetDate };