const jwt = require("jsonwebtoken");
const { secret } = require("../config/config");

function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.json({
        code: "4001",
        message: "请先登录",
        data: null,
      });
    }
    const decoded = jwt.verify(token, secret);
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.json({
        code: "4002",
        message: "登录已过期，请重新登录",
        data: null,
      });
    }
    return res.json({
      code: "4003",
      message: "无效的token",
      data: null,
    });
  }
}

module.exports = auth;
