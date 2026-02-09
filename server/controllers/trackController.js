const TrackMoudles=require('../models/TrackMoudles')
const { getCoupleInfo }=require('../utils/coupleUtil')
const mongoose=require('mongoose')
async function createTrack(req,res) {
    try{
        const userId=req.user.id
        const coupleResult=await getCoupleInfo(userId)
        if(coupleResult.code!=='0000'){
            return res.json({
                code:coupleResult.code,
                message:coupleResult.message,
                data:null
            })
        }
        const coupleId=coupleResult.data
        const {images,description}=req.body
        if(!description){
            return res.json({
                code:4001,
                message:'描述不能为空',
                data:null
            })
        }
        const newTrack=await TrackMoudles.create({
        coupleId,images,description,createdBy:mongoose.isValidObjectId(userId)?new mongoose.Types.ObjectId(userId):userId})
        if(newTrack){
            return res.json({
                code:'0000',
                message:'创建成功',
                data:newTrack
            })
        }
    }catch(err){
        console.error('创建轨迹失败',err)
        return res.json({
            code:'5000',
            message:'创建轨迹失败',
            data:null,
        });
    }
}
async function getTrack(req,res) {
try{
    const userId=req.user.id
    const coupleResult=await getCoupleInfo(userId)
    if(coupleResult.code!=='0000'){
        return res.json({
            code:coupleResult.code,
            message:coupleResult.message,
            data:null
        })
    }
    const coupleId=coupleResult.data
    const track=await TrackMoudles.find({coupleId}).sort({createdTime: -1})
    if(track){
        return res.json({
            code:'0000',
            message:'获取轨迹成功',
            data:track
        })
    }
    return res.json({
        code:'4001',
        message:'获取轨迹失败',
        data:null
    })
}catch(err){
    console.error('获取轨迹失败',err)
    return res.json({
        code:'5000',
        message:'获取轨迹失败',
        data:null
    })
}}
async function deleteTrack(req,res) {
    try{
        const userId=req.user.id
        const coupleResult=await getCoupleInfo(userId)
        if(coupleResult.code!=='0000'){
            return res.json({
                code:coupleResult.code,
                message:coupleResult.message,
                data:null
            })
        }
        const coupleId=coupleResult.data    
        const {id}=req.params
        const track=await TrackMoudles.findOneAndDelete({_id:id,coupleId})
        if(!track){
            return res.json({
                code:'4001',
                message:'未找到该轨迹或无权限删除',
                data:null
            })
        }
        return res.json({
            code:'0000',
            message:'删除轨迹成功',
            data:track
        })
    }catch(err){
        console.error('删除轨迹失败',err)
        return res.json({
            code:'5000',
            message:'删除轨迹失败',
            data:null
        })
    }
}
module.exports = { createTrack,getTrack,deleteTrack };