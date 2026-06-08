const express = require('express')
const router = express.Router()
const ContactSchema = require('../model/contactSchema')
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary').v2

require('dotenv').config()

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})

router.get("/dashboard-stats", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        const students = await ContactSchema.find({
            _uid: verify._id
        });

        const now = new Date();

        const currentMonthStudents =
            students.filter(student => {

                const createdDate =
                    new Date(student.createdAt);

                return (
                    createdDate.getMonth() ===
                    now.getMonth()
                    &&
                    createdDate.getFullYear() ===
                    now.getFullYear()
                );

            });

        const recentStudents =
            await ContactSchema.find({
                _uid: verify._id
            })
                .sort({ createdAt: -1 })
                .limit(5);

        res.status(200).json({
            totalStudents: students.length,
            newStudentsThisMonth:
                currentMonthStudents.length,
            recentStudents
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            msg: "Failed"
        });
    }
});

router.get("/count", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        const totalStudents =
            await ContactSchema.countDocuments({
                _uid: verify._id
            });

        res.status(200).json({
            totalStudents
        });

    } catch (err) {

        res.status(500).json({
            msg: "Failed"
        });
    }
});

router.get("/get-all", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        const data = await ContactSchema.find({
            _uid: verify._id
        });

        return res.status(200).json({
            success: true,
            students: data
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            msg: "Failed to fetch students"
        });
    }
});

router.get("/getById/:_id", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        const data = await ContactSchema.findOne({
            _id: req.params._id,
            _uid: verify._id
        });

        if (!data) {
            return res.status(404).json({
                success: false,
                msg: "Student not found"
            });
        }

        return res.status(200).json({
            success: true,
            student: data
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            msg: "Failed to fetch student"
        });
    }
});

router.post("/post", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        if (!req.files || !req.files.photo) {
            return res.status(400).json({
                success: false,
                msg: "Student photo is required"
            });
        }

        const existingStudent =
            await ContactSchema.findOne({
                email: req.body.email.toLowerCase()
            });

        if (existingStudent) {
            return res.status(409).json({
                success: false,
                msg: "Student email already exists"
            });
        }

        const image =
            await cloudinary.uploader.upload(
                req.files.photo.tempFilePath
            );

        const contact = new ContactSchema({
            userName: req.body.userName,
            email: req.body.email.toLowerCase(),
            password: req.body.password,
            batchName: req.body.batchName,
            _uid: verify._id,
            imgUrl: image.secure_url,
            imgId: image.public_id
        });

        const savedStudent =
            await contact.save();

        return res.status(201).json({
            success: true,
            msg: "Student added successfully",
            student: savedStudent
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            msg: "Failed to add student"
        });
    }
});

router.get("/get-all-by-batch/:batchName", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        const students =
            await ContactSchema.find({
                batchName: req.params.batchName,
                _uid: verify._id
            });

        return res.status(200).json({
            success: true,
            totalStudents: students.length,
            batch_students: students
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            msg: "Failed to fetch batch students"
        });
    }
});

router.delete(
    "/delete-all-contact-by-batchName/:batchName",
    async (req, res) => {
        try {

            const verify = jwt.verify(
                req.headers.authorization.split(" ")[1],
                process.env.JWT_SECRET
            );

            const students =
                await ContactSchema.find({
                    batchName: req.params.batchName,
                    _uid: verify._id
                });

            if (students.length === 0) {
                return res.status(404).json({
                    success: false,
                    msg: "No students found"
                });
            }

            for (const student of students) {

                if (student.imgId) {
                    await cloudinary.uploader.destroy(
                        student.imgId
                    );
                }
            }

            await ContactSchema.deleteMany({
                batchName: req.params.batchName,
                _uid: verify._id
            });

            return res.status(200).json({
                success: true,
                msg: "All students deleted successfully"
            });

        } catch (err) {

            console.log(err);

            return res.status(500).json({
                success: false,
                msg: "Failed to delete students"
            });
        }
    }
);

router.delete("/delete/:id", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        const student =
            await ContactSchema.findById(
                req.params.id
            );

        if (!student) {
            return res.status(404).json({
                success: false,
                msg: "Student not found"
            });
        }

        if (student._uid !== verify._id) {
            return res.status(401).json({
                success: false,
                msg: "Invalid request"
            });
        }

        if (student.imgId) {
            await cloudinary.uploader.destroy(
                student.imgId
            );
        }

        await ContactSchema.findByIdAndDelete(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            msg: "Student deleted successfully"
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            msg: "Failed to delete student"
        });
    }
});

router.put("/update/:_id", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        const student =
            await ContactSchema.findById(
                req.params._id
            );

        if (!student) {
            return res.status(404).json({
                success: false,
                msg: "Student not found"
            });
        }

        if (student._uid !== verify._id) {
            return res.status(401).json({
                success: false,
                msg: "Invalid request"
            });
        }

        const existingStudent =
            await ContactSchema.findOne({
                email: req.body.email.toLowerCase(),
                _id: { $ne: req.params._id }
            });

        if (existingStudent) {
            return res.status(409).json({
                success: false,
                msg: "Email already exists"
            });
        }

        const updateData = {
            userName: req.body.userName,
            email: req.body.email.toLowerCase(),
            password: req.body.password,
            batchName: req.body.batchName
        };

        if (
            req.files &&
            req.files.photo
        ) {

            if (student.imgId) {
                await cloudinary.uploader.destroy(
                    student.imgId
                );
            }

            const updatedImg =
                await cloudinary.uploader.upload(
                    req.files.photo.tempFilePath
                );

            updateData.imgUrl =
                updatedImg.secure_url;

            updateData.imgId =
                updatedImg.public_id;
        }

        const updatedStudent =
            await ContactSchema.findByIdAndUpdate(
                req.params._id,
                updateData,
                { new: true }
            );

        return res.status(200).json({
            success: true,
            msg: "Student updated successfully",
            student: updatedStudent
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            msg: "Failed to update student"
        });
    }
});

router.get("/students-per-batch", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        const data = await ContactSchema.aggregate([
            {
                $match: {
                    _uid: verify._id
                }
            },
            {
                $group: {
                    _id: "$batchName",
                    students: {
                        $sum: 1
                    }
                }
            }
        ]);

        res.status(200).json({
            chartData: data
        });
    }
    catch (err) {

        console.log(err);

        return res.status(500).json({
            error: err.message
        });

    }
});

router.get("/monthly-admissions", async (req, res) => {
    try {

        const verify = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        );

        const data = await ContactSchema.aggregate([
            {
                $match: {
                    _uid: verify._id,
                    createdAt: { $exists: true }
                }
            },
            {
                $group: {
                    _id: {
                        month: {
                            $month: "$createdAt"
                        }
                    },
                    students: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    "_id.month": 1
                }
            }
        ]);

        res.status(200).json({
            chartData: data
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            msg: "Failed"
        });

    }
});

module.exports = router;