const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const musicController = require("../controllers/musicController");

router.use(authMiddleware);

router.post("/saveMusic", musicController.saveMusic);
router.get("/getMusic", musicController.getMusic);
router.delete("/deleteMusic/:id", musicController.deleteMusic);
module.exports = router;