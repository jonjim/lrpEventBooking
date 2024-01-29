const mongoose = require('mongoose');

const emailRecordSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lrpEvent'
    },
    message: String,
    subject: String,
})

module.exports = mongoose.model('emailRecord', emailRecordSchema);