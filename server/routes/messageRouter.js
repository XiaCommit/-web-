const express = require("express");
const router = express.Router();
const { getMessage } = require("../controllers/messageController");
const authMiddleware = require("../middleware/auth");
router.use(authMiddleware);
router.get("/getMessage", getMessage);
module.exports = router;