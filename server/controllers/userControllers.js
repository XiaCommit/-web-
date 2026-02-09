const UserModel = require("../models/UserModels");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const { secret } = require("../config/config");
const jwt = require("jsonwebtoken");

async function register(req, res) {
  try {
    const { gender, birthday, username, password } = req.body;
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return res.json({
        code: "2001",
        message: "该用户名已存在",
        data: null,
      });
    }

    let inviteCode = null;
    do {
      inviteCode = uuidv4().replace(/-/g, "").slice(0, 8);
    } while (await UserModel.findOne({ inviteCode }));

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      gender,
      birthday: new Date(birthday),
      username,
      password: hashedPassword,
      inviteCode,
    });

    const userData = {
      id: newUser._id,
      username: newUser.username,
      gender: newUser.gender,
      birthday: newUser.birthday,
      inviteCode: newUser.inviteCode,
      createdAt: newUser.createdAt,
    };

    return res.json({
      code: "0000",
      message: "注册成功",
      data: { user: userData },
    });
  } catch (err) {
    console.error("注册失败:", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误",
      data: null,
    });
  }
}

async function login(req, res) {
  try {
    const { username, password, code } = req.body;

    const user = await UserModel.findOne({ username }).select("+password");
    if (!user) {
      return res.json({
        code: "2002",
        message: "该用户不存在",
        data: null,
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.json({
        code: "2003",
        message: "密码错误",
        data: null,
      });
    }

    if (code) {
      const partner = await UserModel.findOne({ inviteCode: code });
      if (!partner) {
        return res.json({
          code: "2005",
          message: "该邀请码无效",
          data: null,
        });
      }

      if (partner._id.toString() === user._id.toString()) {
        return res.json({
          code: "2006",
          message: "不能绑定自己",
          data: null,
        });
      }
      if (!user.partnerInviteCode) {
        user.partnerId = partner._id;
        user.partnerInviteCode = code;
        partner.partnerId = user._id;
        partner.partnerInviteCode = user.inviteCode;

        await user.save();
        await partner.save();
      } else {
        if (user.partnerInviteCode !== code) {
          return res.json({
            code: "2007",
            message: "不能重复绑定其他用户",
            data: null,
          });
        }
      }
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      secret,
      { expiresIn: "7d" }
    );

    const userInfo = {
      id: user._id,
      username: user.username,
      gender: user.gender,
      birthday: user.birthday,
      partnerId: user.partnerId,
      partnerInviteCode: user.partnerInviteCode,
      inviteCode: user.inviteCode,
      createdAt: user.createdAt,
    };

    return res.json({
      code: "0000",
      message: "登录成功",
      data: { token, userInfo },
    });
  } catch (err) {
    console.error("登录失败:", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误",
      data: null,
    });
  }
}
async function updatepassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    const user = await UserModel.findById(userId).select("+password");
    if (!user) {
      return res.json({
        code: "2002",
        message: "该用户不存在",
        data: null,
      });
    }
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.json({
        code: "2003",
        message: "原密码错误",
        data: null,
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    return res.json({
      code: "0000",
      message: "密码更新成功",
      data: null,
    });
  } catch (err) {
    console.error("密码更新失败:", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误",
      data: null,
    });
  }
}
async function updateUserInfo(req, res) {
  try {
    const { username, gender, birthday } = req.body;
    const userId = req.user.id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.json({
        code: "2002",
        message: "该用户不存在",
        data: null,
      });
    }
    user.username = username;
    user.gender = gender;
    
    user.birthday = new Date(birthday);
    await user.save();
    return res.json({
      code: "0000",
      message: "用户信息更新成功",
      data: null,
    });
  } catch (err) {
    console.error("用户信息更新失败:", err);
    return res.json({
      code: "5000",
      message: "服务器内部错误",
      data: null,
    });
  }
}
module.exports = { register, login, updatepassword, updateUserInfo };
