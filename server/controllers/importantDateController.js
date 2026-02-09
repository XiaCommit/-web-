const ImportantDateMoudles = require("../models/ImportantDateMoudles");
const { getCoupleInfo } = require("../utils/coupleUtil");
async function createImportantDate(req, res) {
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
    const { name, date, remark } = req.body;
    if (!name || !date) {
      return res.json({
        code: "3004",
        message: "日子名称日期为必填项",
        data: null,
      });
    }

    let parsedDate;
    if (
      typeof date === "string" &&
      date.includes("年") &&
      date.includes("月") &&
      date.includes("日")
    ) {
      const match = date.match(/(\d+)年(\d+)月(\d+)日/);
      if (match) {
        const [, year, month, day] = match;
        parsedDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
      } else {
        return res.json({
          code: "3005",
          message: "日期格式不正确，请使用YYYY年MM月DD日格式",
          data: null,
        });
      }
    } else {
      parsedDate = new Date(date);
    }

    const newDate = await ImportantDateMoudles.create({
      coupleId,
      name,
      date: parsedDate,
      remark: remark || "",
      createdBy: userId,
    });

    if (newDate) {
      return res.json({
        code: "0000",
        message: "添加成功",
        data: newDate,
      });
    }
  } catch (err) {
    console.error("新增重要日子失败:", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误: " + err.message,
      data: null,
    });
  }
}
async function getImportDate(req, res) {
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
    const importantDate = await ImportantDateMoudles.find({
      coupleId: coupleResult.data,
    });
    if (importantDate) {
      return res.json({
        code: "0000",
        message: "获取数据成功",
        data: importantDate,
      });
    }
  } catch (err) {
    console.error("获取数据失败", err);
    return res.json({
      code: "5000",
      message: "获取数据失败",
      data: null,
    });
  }
}

async function deleteImportantDate(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const coupleResult = await getCoupleInfo(userId);
    if (coupleResult.code !== "0000") {
      return res.json({
        code: coupleResult.code,
        message: coupleResult.message,
        data: null,
      });
    }
    const coupleId = coupleResult.data;
    const deletedDate = await ImportantDateMoudles.findOneAndDelete({
      _id: id,
      coupleId: coupleId,
    });

    if (!deletedDate) {
      return res.json({
        code: "3008",
        message: "未找到该重要日子或无权限删除",
        data: null,
      });
    }
    return res.json({
      code: "0000",
      message: "删除成功",
      data: deletedDate,
    });
  } catch (err) {
    console.error("删除重要日子失败:", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误: " + err.message,
      data: null,
    });
  }
}

async function updateImportantDate(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, date, remark } = req.body;

    const coupleResult = await getCoupleInfo(userId);
    if (coupleResult.code !== "0000") {
      return res.json({
        code: coupleResult.code,
        message: coupleResult.message,
        data: null,
      });
    }
    const coupleId = coupleResult.data;

    let parsedDate;
    if (
      typeof date === "string" &&
      date.includes("年") &&
      date.includes("月") &&
      date.includes("日")
    ) {
      const match = date.match(/(\d+)年(\d+)月(\d+)日/);
      if (match) {
        const [, year, month, day] = match;
        parsedDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
      } else {
        return res.json({
          code: "3005",
          message: "日期格式不正确，请使用YYYY年MM月DD日格式",
          data: null,
        });
      }
    } else {
      parsedDate = new Date(date);
    }

    const updatedDate = await ImportantDateMoudles.findOneAndUpdate(
      { _id: id, coupleId: coupleId },
      { $set: { name, date: parsedDate, remark } },
      { new: true }
    );

    if (!updatedDate) {
      return res.json({
        code: "3009",
        message: "未找到该重要日子或无权限编辑",
        data: null,
      });
    }

    return res.json({
      code: "0000",
      message: "编辑成功",
      data: updatedDate,
    });
  } catch (err) {
    console.error("编辑重要日子失败:", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误: " + err.message,
      data: null,
    });
  }
}

module.exports = {
  createImportantDate,
  getImportDate,
  deleteImportantDate,
  updateImportantDate,
};
