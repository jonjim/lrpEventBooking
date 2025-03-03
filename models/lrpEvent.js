const mongoose = require('mongoose');
const Encounter = require('./encounter');

mongoose.set('strict',false)

const imgSchema = new mongoose.Schema({
    url: String,
    filename: String
});

imgSchema.virtual('thumbnail').get(function() {
    return this.url.replace('/upload', '/upload/c_fill,w_180,h_180');
});

const lrpEventSchema = new mongoose.Schema({
    name: String,
    created:{
        type: Date,
        default: Date.now
    },
    eventStart: {
        type: Date,
        index: true
    },
    eventEnd: Date,
    visible: Boolean,
    cancelled: {
        type: Boolean,
        default: false
    },
    eventHost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'eventHost'
    },
    img: {
        url: String,
        filename: String
    },
    ogCard: {
        url: String,
        filename: String
    },
    registrationFee:{
        value: {
            type: Number,
            default: 0
        }, 
        totalPaid: {
            type: Number,
            default: 0
        },
        datePaid: Date,
        paypalPaymentId: String,
        paypalPayer: String,
    },
    hostName: String,
    hostImg: String,
    location: String,
    locationWeb: String,
    sanctioningOfficer: String,
    eventApproved: Boolean,
    externalBooking: String,
    icInvitation: String,
    fullDescription: String,
    promoDescription: String,
    bunksAvailable: Boolean,
    allowBookings: Boolean,
    overflowQueue: {
        type: Boolean,
        default: true
    },
    limits: {
        playerLimit: { type: Number, default: 50 },
        playerBunkLimit: { type: Number, default: 0 },
        monsterLimit: { type: Number, default: 30 },
        monsterBunkLimit: { type: Number, default: 0 },
        staffLimit: { type: Number, default: 10 },
        staffBunkLimit: { type: Number, default: 0 },
    },
    financials: {
        siteFee: { type: Number, default: 0 },
        insurance: { type: Number, default: 0 },
        sanctioningFee: { type: Number, default: 0 },
        props: { type: Number, default: 0 },
        admin: { type: Number, default: 0 },
        otherCosts: { type: Number, default: 0 }
    },
    bookingOpen: Boolean,
    eventTickets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'eventTicket'
    }],
    catering: {
        display: Boolean,
        caterer: String,
        catererContact: String,
        notes: String,
        choiceRequired: Boolean,
        cost: Number,
        bookingsClose: Date
    },
    attendees: [{
        user: {
            type: mongoose.Types.ObjectId,
            ref: 'User'
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'eventBooking'
        },
        ticketType: {
            type: String,
            lowercase: true,
            enum: ['player', 'playerchild', 'monster', 'monsterchild', 'staff', 'playerbunk', 'monsterbunk', 'staffbunk']
        },
        display: Boolean,
        firstname: String,
        surname: String,
        icName: String,
        faction: String,
        customFields: [{
            name: String,
            value: {}
        }]
    }],
    returnPack: {
        timeInOut:{
            arrivalTimeIn: Date,
            dailyTimeIn: Date, 
            dailyTimeOut: Date,
            departureTimeOut: Date,
            notes: String
        },
        arrivalDeparture:{
            arrivalTime: String,
            departureTime: String,
            notes: String
        },
        eventStaff:{
            gamesOperations: String,
            plotActuation: String, 
            firstAid: String,
            plotTeam: String,
            referees: String,
            otherStaff: [{
                title: String, 
                members: String
            }]
        },
        parking: String,
        camping: String,
        bunks: String,
        otherNotes: String
    },
    webhooks: {
        discord: Boolean,
        email: Boolean
    },
    encounters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'encounter'
    }]
}, {
    virtuals: {
        playerSpaces: {
            get() {
                return (this.limits.playerLimit - this.attendees.filter(a => ['player', 'playerchild'].includes(a.ticketType)).length)
            }
        },
        playerBunkSpaces: {
            get() {
                return this.limits.playerBunkLimit - this.attendees.filter(a => ['playerbunk'].includes(a.ticketType)).length
            }
        },
        monsterSpaces: {
            get() {
                return this.limits.monsterLimit - this.attendees.filter(a => ['monster', 'monsterchild'].includes(a.ticketType)).length
            }
        },
        monsterBunkSpaces: {
            get() {
                return this.limits.monsterBunkLimit - this.attendees.filter(a => ['monsterbunk'].includes(a.ticketType)).length
            }
        },
        staffSpaces: {
            get() {
                return this.limits.staffLimit - this.attendees.filter(a => ['staff'].includes(a.ticketType)).length
            }
        },
        staffBunkSpaces: {
            get() {
                return this.limits.staffBunkLimit - this.attendees.filter(a => ['staffbunk'].includes(a.ticketType)).length
            }
        },
        ticketsAvailable: {
            get() {
                return this.eventTickets.find(a => new Date(a.availableFrom) <= new Date() && new Date(a.availableTo) >= new Date() && a.available) ? true : false
            }
        },
        imgThumbnail: {
            get() {
                return this.img.url.replace('/upload', '/upload/c_fill,w_300,h_300');
            }
        }
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

lrpEventSchema.virtual('img.path')
    .set(function(value) {
        this.img.url = value;
    })

    lrpEventSchema.post('findOneAndDelete', async function(event) {
        if (event.encounters.length) {
            const res = await Encounter.deleteMany({ _id: { $in: event.encounters } });
        }
    })

module.exports = mongoose.model('lrpEvent', lrpEventSchema);