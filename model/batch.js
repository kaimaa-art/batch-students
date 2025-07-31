const mongoose = require('mongoose')
const batchSchema = mongoose.Schema({
    batchName: { type: String, required: true },
    duration: { type: String, required: true },
    startingDate: { type: String, required: true },
    courseFee: { type: String, required: true },
    description: { type: String, required: true },
    _uid: { type: String, required: true },
    batchImgUrl: { type: String, required: true },
    batchImgId: { type: String, required: true }
})

module.exports = mongoose.model('batch', batchSchema)