const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModels");
const { generateCoupleId } = require("../utils/coupleUtil");
const MessageModel = require("../models/MessageMoudles");
const { secret } = require("../config/config");
function socket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    const sendErrorAndDisconnect = (message) => {
      socket.emit("connection_error", { success: false, message });
      setTimeout(() => socket.disconnect(true), 100);
    };

    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return sendErrorAndDisconnect("缺少认证信息");
      }
      let decoded;
      try {
        decoded = jwt.verify(token, secret);
      } catch (e) {
        if (e.name === "TokenExpiredError") {
          return sendErrorAndDisconnect("登录已过期，请重新登录");
        }
        return sendErrorAndDisconnect("无效的token");
      }
      const userId = decoded.id;
      const user = await UserModel.findById(userId);
      if (!user) {
        return sendErrorAndDisconnect("用户不存在");
      }
      if (!user.partnerId) {
        return sendErrorAndDisconnect("伴侣ID不存在或已失效");
      }
      const partnerId = user.partnerId.toString();
      const coupleId = generateCoupleId(userId, partnerId);
      socket.join(coupleId);
      console.log(`用户 ${userId} 成功加入情侣房间：${coupleId}`);

      socket.emit("connection_success", {
        success: true,
        coupleId,
        message: "连接成功"
      });
      socket.on("send_couple_message", async (data) => {
        if (!data || !data.content) {
          return socket.emit("msg_error", {
            success: false,
            message: "消息内容不能为空",
            data: null,
          });
        }
        if (typeof data.content !== "string" || data.content.length > 1000) {
          return socket.emit("msg_error", {
            success: false,
            message: "消息内容过长，最多1000个字符",
            data: null,
          });
        }
        const now = new Date();
        let nextSeq = 1;
        try {
          const maxDoc = await MessageModel.findOne({ coupleId })
            .sort({ sequenceId: -1 })
            .select("sequenceId")
            .lean();
          nextSeq = (maxDoc?.sequenceId ?? 0) + 1;
        } catch (e) {
          console.error("获取 sequenceId 失败：", e);
        }
        const newMessage = {
          content: data.content,
          from: userId,
          to: partnerId,
          coupleId,
          timestamp: now,
          sequenceId: nextSeq,
        };

        let savedMessage;
        try {
          savedMessage = await MessageModel.create(newMessage);
        } catch (error) {
          console.error("保存消息失败：", error);
          return socket.emit("msg_error", {
            success: false,
            message: "消息保存失败",
            data: null,
          });
        }

        const ts = savedMessage.timestamp
          ? new Date(savedMessage.timestamp).toISOString()
          : new Date().toISOString();
        const messageToSend = {
          _id: savedMessage._id.toString(),
          sequenceId: savedMessage.sequenceId,
          content: savedMessage.content,
          from: savedMessage.from.toString(),
          to: savedMessage.to.toString(),
          timestamp: ts,
        };

        socket.to(coupleId).emit("receive_couple_message", messageToSend);
        socket.emit("receive_couple_message", messageToSend);

        socket.emit("msg_success", {
          success: true,
          message: "消息发送成功",
          data: messageToSend,
        });
      });

      socket.on("disconnect", (reason) => {
        console.log(`用户 ${userId} 断开连接，原因：${reason}`);
      });

    } catch (error) {
      console.error("Socket 连接处理异常：", error);
      sendErrorAndDisconnect("服务器内部错误，请稍后重试");
    }
  });
}

module.exports = { socket };