var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
let importantDateRoute = require("./routes/importantDateRoute.js");
let accountRouter = require("./routes/accountRouter.js");
let meetDateRouter = require("./routes/meetDateRouter.js");
let avatarRouter = require("./routes/avatarRouter.js");
let trackRouter = require("./routes/trackRouter.js");
let musicRouter = require("./routes/musicRouter.js");
let messageRouter = require("./routes/messageRouter.js");
var app = express();

const db = require("./db/db.js");
db(
  () => {
    console.log("数据库连接成功！");
  },
  () => {
    console.log("数据库连接失败！");
  }
);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json({ limit: "10mb" })); // 增加JSON请求体大小限制到10MB
app.use(express.urlencoded({ extended: false, limit: "10mb" })); // 增加URL编码请求体大小限制
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/api", usersRouter);
app.use("/api", importantDateRoute);
app.use("/api", accountRouter);
app.use("/api", meetDateRouter);
app.use("/api", avatarRouter);
app.use("/api/track", trackRouter);
app.use("/api", musicRouter);
app.use("/api", messageRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;

