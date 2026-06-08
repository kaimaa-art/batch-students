const express = require("express");
const router = express.Router();
const batchSchema = require("../model/batch");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;

require("dotenv").config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

/* ===========================
   CREATE BATCH
=========================== */

router.get("/count", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        const totalBatches =
            await batchSchema.countDocuments({
                _uid: verify._id
            });

        res.status(200).json({
            totalBatches
        });

    } catch (err) {

        res.status(500).json({
            msg: "Failed"
        });
    }
});

router.post("/create-batch", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        if (!req.files || !req.files.batchImg) {
            return res.status(400).json({
                success: false,
                msg: "Batch image is required",
            });
        }

        const batchImg =
            await cloudinary.uploader.upload(
                req.files.batchImg.tempFilePath
            );

        const data = new batchSchema({
            batchName: req.body.batchName,
            duration: req.body.duration,
            startingDate: req.body.startingDate,
            courseFee: req.body.courseFee,
            description: req.body.description,
            _uid: verify._id,
            batchImgUrl: batchImg.secure_url,
            batchImgId: batchImg.public_id,
        });

        const newData = await data.save();

        return res.status(201).json({
            success: true,
            batch: newData,
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            msg: "Failed to create batch",
        });
    }
});

/* ===========================
   GET ALL BATCHES
=========================== */

router.get("/get-all-batch", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        const batchesData =
            await batchSchema.find({
                _uid: verify._id,
            });

        return res.status(200).json({
            success: true,
            batches: batchesData,
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            msg: "Failed to fetch batches",
        });
    }
});

/* ===========================
   GET BATCH BY ID
=========================== */

router.get("/get-batch-by-id/:_id", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        const batchData =
            await batchSchema.findOne({
                _id: req.params._id,
                _uid: verify._id,
            });

        return res.status(200).json({
            success: true,
            batch: batchData,
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            msg: "Failed to fetch batch",
        });
    }
});

/* ===========================
   DELETE BATCH
=========================== */

router.delete("/delete-batch/:_id", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        const batchData =
            await batchSchema.findById(
                req.params._id
            );

        if (!batchData) {
            return res.status(404).json({
                success: false,
                msg: "Batch not found",
            });
        }

        if (verify._id !== batchData._uid) {
            return res.status(401).json({
                success: false,
                msg: "Invalid request",
            });
        }

        await cloudinary.uploader.destroy(
            batchData.batchImgId
        );

        await batchSchema.findByIdAndDelete(
            req.params._id
        );

        return res.status(200).json({
            success: true,
            msg: "Batch deleted successfully",
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            msg: "Failed to delete batch",
        });
    }
});

/* ===========================
   UPDATE BATCH
=========================== */

router.put("/update-batch/:_id", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        const batchData =
            await batchSchema.findById(
                req.params._id
            );

        if (!batchData) {
            return res.status(404).json({
                success: false,
                msg: "Batch not found",
            });
        }

        if (verify._id !== batchData._uid) {
            return res.status(401).json({
                success: false,
                msg: "Invalid request",
            });
        }

        const updateData = {
            batchName: req.body.batchName,
            duration: req.body.duration,
            startingDate: req.body.startingDate,
            courseFee: req.body.courseFee,
            description: req.body.description,
        };

        if (
            req.files &&
            req.files.batchImg
        ) {

            await cloudinary.uploader.destroy(
                batchData.batchImgId
            );

            const newImg =
                await cloudinary.uploader.upload(
                    req.files.batchImg.tempFilePath
                );

            updateData.batchImgUrl =
                newImg.secure_url;

            updateData.batchImgId =
                newImg.public_id;
        }

        const newData =
            await batchSchema.findByIdAndUpdate(
                req.params._id,
                updateData,
                {
                    new: true,
                }
            );

        return res.status(200).json({
            success: true,
            batch: newData,
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            msg: "Failed to update batch",
        });
    }
});

module.exports = router;