const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth"); // 登录校验中间件
const importantDateController = require("../controllers/importantDateController");
router.use(authMiddleware);
router.post("/importDate", importantDateController.createImportantDate);
router.get("/importDate", importantDateController.getImportDate);
router.delete("/importDate/:id", importantDateController.deleteImportantDate);
router.put("/importDate/:id", importantDateController.updateImportantDate);
module.exports = router;
