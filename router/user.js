const express = require("express");
const router = express.Router();
const userSchema = require("../model/userSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;

require("dotenv").config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

/* ===========================
   SIGNUP
=========================== */

router.post("/signup", async (req, res) => {
    try {

        const existingUser = await userSchema.findOne({
            email: req.body.email,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                msg: "Email already exists",
            });
        }

        if (!req.files || !req.files.logo) {
            return res.status(400).json({
                success: false,
                msg: "Logo is required",
            });
        }

        const hashedPassword = await bcrypt.hash(
            req.body.password,
            10
        );

        const uploadedLogo =
            await cloudinary.uploader.upload(
                req.files.logo.tempFilePath
            );

        const newUser = new userSchema({
            userName: req.body.userName,
            email: req.body.email.toLowerCase(),
            password: hashedPassword,
            number: req.body.number,
            logoUrl: uploadedLogo.secure_url,
            logoId: uploadedLogo.public_id,
        });

        await newUser.save();

        return res.status(201).json({
            success: true,
            msg: "User registered successfully",
            user: newUser,
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            msg: "Internal Server Error",
        });
    }
});

/* ===========================
   LOGIN
=========================== */

router.post("/login", async (req, res) => {
    try {

        const user = await userSchema.findOne({
            email: req.body.email,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "Email does not exist",
            });
        }

        const isPasswordMatched =
            await bcrypt.compare(
                req.body.password,
                user.password
            );

        if (!isPasswordMatched) {
            return res.status(401).json({
                success: false,
                msg: "Invalid password",
            });
        }

        const token = jwt.sign(
            {
                _id: user._id,
                userName: user.userName,
                email: user.email,
                number: user.number,
                logoUrl: user.logoUrl,
                logoId: user.logoId,
            },
            process.env.JWT_SECRET || "secret123",
            {
                expiresIn: "365d",
            }
        );

        return res.status(200).json({
            success: true,
            msg: "Login successful",
            token,
            _id: user._id,
            userName: user.userName,
            email: user.email,
            number: user.number,
            logoUrl: user.logoUrl,
            logoId: user.logoId,
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            msg: "Internal Server Error",
        });
    }
});

module.exports = router;