const express = require('express')
const app = express()
const contactRoute = require('./router/contact')
const userRoute = require('./router/user')
const batchRoute = require('./router/batch')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const cors = require('cors')

require('dotenv').config()

const dataBaseConnectivity = async () => {
    try {
        await mongoose.connect(process.env.MONGOOSE_URL)
        console.log("connected to the data base successfully")
    }
    catch (err) {
        console.log("something is wrong , data base connectivity is fail")
        console.log(err)
    }
}

dataBaseConnectivity()


app.use(bodyParser.urlencoded({ extended: false }))

app.use(fileUpload({
    useTempFiles: true
}))

app.use(bodyParser.json())

app.use(cors())


app.use('/contact', contactRoute)
app.use('/auth', userRoute)
app.use('/batch', batchRoute)



module.exports = app;