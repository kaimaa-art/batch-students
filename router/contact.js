const express = require('express')
const router = express.Router()
const ContactSchema = require('../model/contactSchema')
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary').v2

require('dotenv').config()

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRATE
})


//---------------------------get all route-------------------------------------------
router.get('/get-all', async (req, res) => {
    try {
        const verify = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRATE_KEY)
        const data = await ContactSchema.find({ _uid: verify._id })
        res.status(200).json({
            msg: data
        })
    }
    catch (err) {
        console.log("error " + err)
    }
})

//---------------------------------get by id-----------------------------------------

router.get('/getById/:_id', async (req, res) => {
    try {
        const verify = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRATE_KEY)
        const data = await ContactSchema.findOne({ _uid: verify._id, _id: req.params._id })
        res.status(200).json({
            contact: data
        })
    }
    catch (err) {
        console.log("error " + err)
    }
})

//--------------------------------post route------------------------------------------

router.post('/post', async (req, res) => {
    try {
        const verify = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRATE_KEY)
        const image = await cloudinary.uploader.upload(req.files.photo.tempFilePath)
        const contactSchema = new ContactSchema({
            userName: req.body.userName,
            email: req.body.email,
            password: req.body.password,
            batchName: req.body.batchName,
            _uid: verify._id,
            imgUrl: image.secure_url,
            imgId: image.public_id
        })

        const data = await contactSchema.save()

        res.status(200).json({
            msg: "data is saved",
            Data: data
        })
    }

    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
})

//-------------------------------------get batch--------------------------------------

router.get("/get-all-by-batch/:batchName", async (req, res) => {
    try {
        const verify = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRATE_KEY)
        const data = await ContactSchema.find({ batchName: req.params.batchName, _uid: verify._id })
        res.status(200).json({
            batch_students: data
        })
    }
    catch (err) {
        console.log("error " + err)
        res.status(500).json({
            error: err
        })
    }
})

//--------------------------------------delete all contact by batch name--------------------

router.delete("/delete-all-contact-by-batchName/:batchName", async (req, res) => {
    try {
        const verify = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRATE_KEY)
        const data = await ContactSchema.find({ batchName: req.params.batchName })
        if (!data.every(d => d._uid == verify._id)) {
            return res.status(409).json({
                error: "invalid request"
            })
        }
        for (const contact of data) {
            if (contact.imgId) {
                await cloudinary.uploader.destroy(contact.imgId);
            }
        }

        await ContactSchema.deleteMany({ batchName: req.params.batchName })
        res.status(200).json({
            msg: "data has been deleted"
        })
    }
    catch (err) {
        console.log("error " + err)
        res.status(500).json({
            error: err
        })
    }
})

//----------------------------------delete route-------------------------------------

router.delete("/delete/:id", async (req, res) => {
    try {
        const verify = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRATE_KEY)
        const data = await ContactSchema.find({ _id: req.params.id })
        if (data[0]._uid != verify._id) {
            return res.status(409).json({
                msg: "invalid request"
            })
        }
        await cloudinary.uploader.destroy(data[0].imgId)
        await ContactSchema.findByIdAndDelete({ _id: req.params.id })
        res.status(200).json({
            msg: "Data has been deleted"
        })
    }
    catch (err) {
        console.log("error " + err)
        res.status(500).json({
            error: err
        })
    }
})

//---------------------------------------put route-------------------------------------

router.put('/update/:_id', async (req, res) => {
    try {
        const verify = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRATE_KEY)
        const data = await ContactSchema.findOne({ _id: req.params._id })
        if (data._uid != verify._id) {
            return res.status(409).json({
                msg: "invalid request"
            })
        }
        if (req.files) {
            await cloudinary.uploader.destroy(data.imgId)
            const updatedImg = await cloudinary.uploader.upload(req.files.photo.tempFilePath)
            const contact = {
                userName: req.body.userName,
                email: req.body.email,
                password: req.body.password,
                batchName: req.body.batchName,
                imgUrl: updatedImg.secure_url,
                imgId: updatedImg.public_id
            }

            const newdata = await ContactSchema.findByIdAndUpdate(req.params._id, contact, { new: true })
            res.status(200).json({
                msg: "Data updated successfully",
                msg: newdata
            })
        }
        else {
            await cloudinary.uploader.destroy(data.imgId)
            const updatedImg = await cloudinary.uploader.upload(req.files.photo.tempFilePath)
            const contact = {
                userName: req.body.userName,
                email: req.body.email,
                password: req.body.password,
                batchName: req.body.batchName,
                imgUrl: updatedImg.secure_url,
                imgId: updatedImg.public_id
            }

            const newdata = await ContactSchema.findByIdAndUpdate(req.params._id, contact, { new: true })
            res.status(200).json({
                msg: "Data updated successfully",
                msg: newdata
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



module.exports = router;