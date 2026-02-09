const AccountMoudles = require("../models/AccountMoudles");
const mongoose = require("mongoose");
const { getCoupleInfo } = require("../utils/coupleUtil");
async function createAccount(req, res) {
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
    const { name, account, accountType, date, remark } = req.body;
    if (!name || !date || !account || !accountType) {
      return res.json({
        code: "4001",
        message: "账单名称，账单金额，账单类型以及账单日期为必填项",
        data: null,
      });
    }

    const accountNum = Number(account);
    const accountTypeNum = Number(accountType);
    if (isNaN(accountNum) || accountNum <= 0) {
      return res.json({
        code: "4004",
        message: "账单金额必须为大于0的有效数字",
        data: null,
      });
    }
    if (isNaN(accountTypeNum) || ![1, 2, 3, 4, 5].includes(accountTypeNum)) {
      // 假设1=收入，2=支出，限制枚举值
      return res.json({
        code: "4005",
        message: "账单类型无效",
        data: null,
      });
    }
    let parsedDate = null;
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
          code: "4002",
          message: "日期格式不正确，请使用YYYY年MM月DD日格式",
          data: null,
        });
      }
    } else {
      parsedDate = new Date(date);
    }
    const newDate = await AccountMoudles.create({
      coupleId,
      name,
      account: accountNum,
      accountType: accountTypeNum,
      date: parsedDate,
      remark: remark || "",
      createdBy: mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId,
    });
    if (newDate) {
      return res.json({
        code: "0000",
        message: "新增账单成功",
        data: newDate.toJSON(),
      });
    }
  } catch (err) {
    console.error("账单添加失败", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误",
      data: null,
    });
  }
}
async function getAccount(req,res) {
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
    const account = await AccountMoudles.find({
      coupleId,
    });
    if (account) {
      return res.json({
        code: "0000",
        message: "获取账单成功",
        data: account,
      });
    }
  } catch (err) {
    console.error("获取账单失败", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误",
      data: null,
    });
  }
}
async function deleteAccount(req, res) {
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
    
    const account = await AccountMoudles.findOne({
      _id: id,
      coupleId: coupleId,
    });
    
    if (!account) {
      return res.json({
        code: "4006",
        message: "未找到该账单或无权限删除",
        data: null,
      });
    }
    
    // 删除账单
    await AccountMoudles.findByIdAndDelete(id);
    
    return res.json({
      code: "0000",
      message: "删除账单成功",
      data: account,
    });
  } catch (err) {
    console.error("删除账单失败", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误",
      data: null,
    });
  }
}
async function updateAccount(req, res) {
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
    const { name, account, accountType, date, remark } = req.body;
    const accountNum = Number(account);
    const accountTypeNum = Number(accountType);
    if (isNaN(accountNum) || accountNum <= 0) {
      return res.json({
        code: "4004",
        message: "账单金额必须为大于0的有效数字",
        data: null,
      });
    }
    if (isNaN(accountTypeNum) || ![1, 2, 3, 4, 5].includes(accountTypeNum)) {
      return res.json({
        code: "4005",
        message: "账单类型无效",
        data: null,
      });
    }
    let parsedDate=null;
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
    const updatedDate = await AccountMoudles.findOneAndUpdate(
      { _id: id, coupleId: coupleId },
      { $set: { name, account: accountNum, accountType: accountTypeNum, date: parsedDate, remark } },
      { new: true }
    );
    if (!updatedDate) {
      return res.json({
        code: "4006",
        message: "未找到该账单或无权限更新",
        data: null,
      });
    }
    return res.json({
      code: "0000",
      message: "更新账单成功",
      data: updatedDate,
    });
  } catch (err) {
    console.error("更新账单失败", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误",
      data: null,
    });
  }
}
module.exports = { createAccount, getAccount, deleteAccount ,updateAccount};
