const express = require('express')
const router = express.Router()
const batchSchema = require('../model/batch')
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary').v2

require('dotenv').config

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.api_key,
    api_secret: process.env.API_SECRATE
})

router.post('/create-batch', async (req, res) => {
    try {
        const verify = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRATE_KEY)
        const batchImg = await cloudinary.uploader.upload(req.files.batchImg.tempFilePath)
        const data = new batchSchema({
            batchName: req.body.batchName,
            duration: req.body.duration,
            startingDate: req.body.startingDate,
            courseFee: req.body.courseFee,
            description: req.body.description,
            _uid: verify._id,
            batchImgUrl: batchImg.secure_url,
            batchImgId: batchImg.public_id
        })
        const newData = await data.save()
        res.status(200).json({
            newData: newData
        })
    }
    catch (err) {
        console.log("error " + err)
        res.status(500).json({
            error: err
        })
    }
})

router.get('/get-all-batch', async (req, res) => {
    try {
        const verify = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRATE_KEY)
        const batchesData = await batchSchema.find({ _uid: verify._id })
        res.status(200).json({
            batches: batchesData
        })
    }
    catch (err) {
        console.log("error " + err)
        res.status(500).json({
            error: err
        })
    }
})

router.get('/get-batch-by-id/:_id', async (req, res) => {
    try {
        const verify = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRATE_KEY)
        const batchData = await batchSchema.findById({ _uid: verify._id, _id: req.params._id })
        res.status(200).json({
            batch: batchData
        })
    }
    catch (err) {
        console.log("eror " + err)
        res.status(500).json({
            error: err
        })
    }
})

router.delete('/delete-batch/:_id', async (req, res) => {
    try {
        const verify = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRATE_KEY)
        const matchingId = await batchSchema.findById(req.params._id)
        if (verify._id != matchingId._uid) {
            res.status(401).json({
                error: "invalid request"
            })
        }
        await cloudinary.uploader.destroy(matchingId.batchImgId)
        await batchSchema.findByIdAndDelete(req.params._id)
        res.status(200).json({
            msg: "data deleted"
        })
    }
    catch (err) {
        console.log("error " + err)
        res.status(500).json({
            error: err
        })
    }
})

router.put('/update-batch/:_id', async (req, res) => {
    try {
        const verify = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRATE_KEY)
        const batchData = await batchSchema.findById(req.params._id)
        if (verify._id != batchData._uid) {
            res.status(401).json({
                error: "invalid request"
            })
        }
        if (req.files) {
            const deleteImg = await cloudinary.uploader.destroy(batchData.batchImgId)
            const newImg = await cloudinary.uploader.upload(req.files.batchImg.tempFilePath)
            const dataStruct = {
                batchName: req.body.batchName,
                startingDate: req.body.startingDate,
                duration: req.body.duration,
                courseFee: req.body.courseFee,
                description: req.body.dercription,
                batchImgUrl: newImg.secure_url,
                batchImgId: newImg.public_id
            }
            const newData = await batchSchema.findByIdAndUpdate(req.params._id, dataStruct, { new: true })
            res.status(200).json({
                newData: newData
            })
        }
        else {
            const dataStruct = {
                batchName: req.body.batchName,
                startingDate: req.body.startingDate,
                duration: req.body.duration,
                courseFee: req.body.courseFee,
                description: req.body.dercription
            }
            const newData = await batchSchema.findByIdAndUpdate(req.params._id, dataStruct, { new: true })
            res.status(200).json({
                newData: newData
            })
        }
    }
    catch (err) {
        console.log("error " + err)
        res.status(500).json({
            error: err
        })
    }
})






module.exports = router