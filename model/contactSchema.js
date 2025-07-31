const mongoose = require('mongoose')
const contactSchema = mongoose.Schema({
    userName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    batchName: { type: String, required: true },
    _uid: { type: String, required: true },
    imgUrl: { type: String, require: true },
    imgId: { type: String, require: true }
})


module.exports = mongoose.model('contact', contactSchema)