const express = require("express");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const cors = require("cors");
require("dotenv").config();

const contactRoute = require("./router/contact");
const userRoute = require("./router/user");
const batchRoute = require("./router/batch");

const app = express();

/* Database Connection */
const dataBaseConnectivity = async () => {
    try {
        await mongoose.connect(process.env.MONGOOSE_URL);

        console.log("✅ Database Connected Successfully");
    } catch (err) {
        console.log("❌ Database Connection Failed");
        console.log(err);
        process.exit(1);
    }
};

dataBaseConnectivity();

/* Middlewares */
app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use(
    fileUpload({
        useTempFiles: true,
    })
);

app.use(
    cors({
        origin: "*",
        credentials: true,
    })
);

/* Health Check */
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API Running Successfully",
    });
});

/* Routes */
app.use("/contact", contactRoute);
app.use("/auth", userRoute);
app.use("/batch", batchRoute);

/* 404 Handler */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found",
    });
});

/* Global Error Handler */
app.use((err, req, res, next) => {
    console.log(err);

    res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
});

module.exports = app;