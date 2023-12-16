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
    terms: String,
    systemRef: String,
    active: {
        type: Boolean,
        default: true
    },
    customFields: [
        {
            label: String,
            name: String,
            type: {
                type: String,
                enum: ['text', 'number', 'checkbox', 'select'],
                default: 'text'
            },
            options: [{type: String}],
            required: {
                type:Boolean,
                default: false
            },
            section: {
                type: String, 
                enum: ['character','player']
            },
            defaultValue: String,
            description: String,
            placeholder: String,
            error: String
        }
    ],
    customTools:[{ type: String }]
})

eventSystemSchema.virtual('img.path')
.set(function (value) {
    this.img.url = value;
})

module.exports = mongoose.model('eventSystems', eventSystemSchema);