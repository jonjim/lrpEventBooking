const mongoose = require('mongoose');

const encounterSchema = new mongoose.Schema({
    name: String,
    date: Date,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lrpEvent'
    },
    type: {
        type: String,
        enum: ['Non-Combat/Combat', 'Combat', 'Non-Combat', 'Ritual']
    },
    description: String,
    inbound: {
        method: {
            type: String,
            enum: ['Transport', 'Walk', 'Appear', 'None']
        },
        description: String
    },
    outbound: {
        method: {
            type: String,
            enum: ['Transport', 'Walk', 'Appear', 'None']
        },
        description: String
    },
    costumeInformation: {
        type: String,
        enum: ['None', 'Basic', 'Character']
    },
    costumeNotes: String,
    makeupInformation: {
        type: String,
        enum: ['None', 'Simple', 'Moderate', 'Complex']
    },
    makeupNotes: String,
    monsters: [{
        monster: {type: mongoose.Schema.Types.ObjectId,
                    ref: 'Monster'},
        qty: String
    }
    ],
    comments: [{
        text: String,
        authorName: String,
        linkedAuthor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        created: Date,
    }]
})

module.exports = mongoose.model('encounter', encounterSchema);