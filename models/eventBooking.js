const mongoose = require('mongoose');
const Event = require('./event');

const eventBookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    originalUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    eventTickets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'eventTicket'
    }],
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    },
    bookingMade: {
        type: Date,
        default: Date.now
    },
    bookingPaid: Date,
    paid: {
        type: Boolean,
        default: false
    },
    payOnGate: {
        type: Boolean,
        default: false
    },
    totalDue: Number,
    totalPaid: {
        type: Number,
        default: 0
    },
    inQueue: {
        type: Boolean,
        default: false
    },
    paypalPaymentId: String,
    paypalPayer: String,
    displayBooking: Boolean,
    playerId: Number,
    firstname: String,
    surname: String
}, {
    virtuals: {
        bookingType: {
            get() {
                if (this.eventTickets.filter(a => ['player', 'playerchild'].includes(a.ticketType)).length > 0)
                    return 'player';
                if (this.eventTickets.filter(a => ['monster', 'monsterchild'].includes(a.ticketType)).length > 0)
                    return 'monster';
                if (this.eventTickets.filter(a => ['staff'].includes(a.ticketType)).length > 0)
                    return 'staff';
            }
        },
    }
})

eventBookingSchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
        await Event.findByIdAndUpdate(doc.event, {
            $pull: {
                attendees: { booking: doc._id }
            }
        })
    }
});

module.exports = mongoose.model('eventBooking', eventBookingSchema);