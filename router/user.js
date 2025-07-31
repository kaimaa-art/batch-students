const express = require('express')
const router = express.Router()
const userSchema = require('../model/userSchema')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary').v2

require('dotenv').config()

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRATE
})

router.post('/signup', async (req, res) => {
    try {
        const users = await userSchema.find({ email: req.body.email })
        if (users.length > 0) {
            return res.status(407).json({
                msg: 'email already exist'
            })
        }
        const hashCode = await bcrypt.hash(req.body.password, 10)
        const uploadinglogo = await cloudinary.uploader.upload(req.files.logo.tempFilePath)
        const data = new userSchema({
            userName: req.body.userName,
            email: req.body.email,
            password: hashCode,
            number: req.body.number,
            logoUrl: uploadinglogo.secure_url,
            logoId: uploadinglogo.public_id

        })
        await data.save()
        res.status(200).json({
            new_data: data
        })
    }

    catch (err) {
        console.log("error " + err)
        res.status(500).json({
            error: err
        })
    }
})

router.post('/login', async (req, res) => {
    try {
        const data = await userSchema.find({ email: req.body.email })
        if (data.length == 0) {
            return res.status(407).json({
                msg: "email does not exist"
            })
        }
        const passComp = await bcrypt.compare(req.body.password, data[0].password)
        if (!passComp) {
            return res.status(404).json({
                msg: "incorrect password"
            })
        }
        const token = await jwt.sign({
            _id: data[0]._id,
            userName: data[0].userName,
            email: data[0].email,
            phNo: data[0].phNo,
            logoUrl: data[0].logoUrl,
            logoId: data[0].logoId
        },
            'secrate key 123',
            {
                expiresIn: '365d'
            })
        res.status(200).json({
            msg: "congrates you are logged in",
            token: token,
            _id: data[0]._id,
            userName: data[0].userName,
            email: data[0].email,
            phNo: data[0].phNo,
            logoUrl: data[0].logoUrl,
            logoId: data[0].logoId
        })

    }
    catch (err) {
        console.log("error " + err)
        res.status(500).json({
            error: err
        })
    }
})


module.exports = router