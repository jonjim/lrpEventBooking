const mongoose = require('mongoose');
const EventBooking = require('./eventBooking')
const Event = require('./event')
const EventHost = require('./eventHost');

const eventSystemSchema = new mongoose.Schema({
    name: String,
    description: String,
    img: {
        url: String,
        filename: String
    },
    website: String,
    terms: String
})

eventSystemSchema.virtual('img.path')
.set(function (value) {
    this.img.url = value;
})

module.exports = mongoose.model('eventSystems', eventSystemSchema);