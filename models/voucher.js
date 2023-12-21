const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    ticketType: {
        type: String,
        lowercase: true,
        enum: ['player', 'playerchild']
    },
    description: String,
    originalUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    value: {
        type: Number,
        default: 0
    },
    eventHost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'eventHost'
    },
    used: Boolean,
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LrpEvent'
    },
})

module.exports = mongoose.model('voucher', voucherSchema);