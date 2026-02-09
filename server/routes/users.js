const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();
const { register, login, updatepassword, updateUserInfo } = require("../controllers/userControllers");
router.post("/register", register);
router.post("/login", login);
router.post("/updatepassword", auth, updatepassword);
router.post("/updateUserInfo", auth, updateUserInfo);
module.exports = router;
