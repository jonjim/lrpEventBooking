const mongoose = require('mongoose');

const eventHostSchema = new mongoose.Schema({
    name: String,
    display: {
        type: Boolean,
        default: false
    },
    img: String,
    contactAddress: String,
    paypalAddress: String,
    paypalPercentage: {
        type: Number,
        default: 1.2
    },
    paypalFixedFee: {
        type: Number,
        default: 0.3
    },
    eventSystem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'eventSystems'
    },
})

module.exports = mongoose.model('eventHost', eventHostSchema);