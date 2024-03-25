const mongoose = require('mongoose');

const lammieSchema = new mongoose.Schema({
    eventSystem: {
        type: mongoose.Types.ObjectId,
        ref: 'eventSystem'
    },
    itemId: String,
    itemType: {
        type: String,
        lowercase: true,
        enum: ['item', 'character', 'power']
    },
    name: String, 
    cardFront: {
        topLeft: String,
        topMiddle: String,
        
    }
})

module.exports = mongoose.model('lammie', lammieSchema);