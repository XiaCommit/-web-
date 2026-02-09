const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const meetDateController=require('../controllers/meetDateController')
router.use(authMiddleware)
router.get('/meetDate',meetDateController.getMeetDate)
router.post('/meetDate',meetDateController.saveMeetDate)
module.exports=router