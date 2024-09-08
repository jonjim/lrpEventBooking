const mongoose = require('mongoose');

const eventSystemSchema = new mongoose.Schema({
    name: String,
    description: String,
    img: {
        url: String,
        filename: String
    },
    website: String,
    facebook: String,
    twitter: String,
    instagram: String,
    discord: String,
    tiktok: String,
    whatsapp: String,
    snapchat: String,
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
            error: String,
            display: {
                type: Boolean,
                default: false
            }
        }
    ],
    lammieFields: [
        {
            label: String,
            name: String,
            type: {
                type: String,
                enum: ['text', 'number', 'checkbox', 'select'],
                default: 'text'
            },
            position: {
                type: String,
                lowercase: true,
                enum: ['topLeft','topCentre','topRight','midLeft','midCentre','midRight','botLeft','botCentre','botRight']
            },
            options: [{type: String}],
            required: {
                type:Boolean,
                default: false
            },
            section: {
                type: String, 
                enum: ['front','back']
            },
            defaultValue: String,
            description: String,
            placeholder: String,
            error: String,
            display: {
                type: Boolean,
                default: false
            }
        }
    ],
    customTools:[{ type: String }],
    sanctioningFee: {
        type: Number,
        default: 0
    },
    webhooks: {
        discord: String
    }
})

eventSystemSchema.virtual('img.path')
.set(function (value) {
    this.img.url = value;
})

eventSystemSchema.virtual('img.thumbnail')
    .get(function () {
        if (this.img?.url)
            return this.img.url.replace('/upload', '/upload/c_fill,h_60');
        else 
            return null
})

module.exports = mongoose.model('eventSystems', eventSystemSchema);