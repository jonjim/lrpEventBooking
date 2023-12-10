const mongoose = require('mongoose');

const eventTicketSchema = new mongoose.Schema({
    ticketType: {
        type: String,
        lowercase: true,
        enum: ['player', 'playerchild', 'playerbunk', 'monster', 'monsterchild', 'monsterbunk', 'mealticket', 'mealticketchild', 'staff', 'staffbunk']
    },
    description: String,
    availableFrom: Date,
    availableTo: Date,
    cost: {
        type: Number,
        default: 0
    },
    caterer: String,
    available: Boolean
})

module.exports = mongoose.model('eventTicket', eventTicketSchema);