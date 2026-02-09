const express=require('express')
const router=express.Router()
const authMiddleware=require('../middleware/auth')
const trackController=require('../controllers/trackController')
router.use(authMiddleware)
router.post('/createTrack',trackController.createTrack)
router.get('/getTrack',trackController.getTrack)
router.delete('/deleteTrack/:id',trackController.deleteTrack)
module.exports=router