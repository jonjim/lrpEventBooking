const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const eventBooking = require('./eventBooking')
const Event = require('./event')
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    email: String,
    verifyCode: {
        type: String,
        default: crypto.randomBytes(16).toString('hex')
    },
    resetPassword: String,
    verified: Boolean,
    authString: String,
    googleId: String,
    facebookId: String,
    displayBookings: Boolean,
    dateCreated: {
        type: Date,
        default: Date.now
    },
    firstname: {
        type: String,
        default: ''
    },
    surname: {
        type: String,
        default: ''
    },
    isAdmin: Boolean,
    isEventHost: Boolean,
    eventHosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'eventHost'
    }],
    role: {
        type: String,
        enum: ['user', 'eventHost', 'sanctioningOfficer', 'admin', 'superAdmin'],
        default: 'user'
    },
    title: String,
    address_1: String,
    address_2: String,
    address_3: String,
    address_4: String,
    postcode: String,
    dob: Date,
    emergencyContactName: String,
    emergencyContactNumber: String,
    emergencyContactRelation: String,
    medicalInfo: String,
    allergyDietary: String,
    character: {
        pid: Number,
        cid: Number,
        requestDate: Date,
        characterName: String,
        playerForename: String,
        playerMiddlename: String,
        playerSurname: String,
        faction: String,
        race: String,
        groupname: String,
        characterSkills: [{
            id: Number,
            name: String,
            cost: Number
        }],
        occupationalSkills: [{
            id: Number,
            name: String,
            tier: Number,
            script: Boolean
        }]
    },
    lorienTrust: {
        refMarshal: String,
        firstAid: Boolean,
        mentalFirstAid: Boolean,
        bowComp: Boolean,
        clawComp: Boolean,
        wepCheck: Boolean,
        playerId: Number,
        authCode: String,
        character: {
            pid: Number,
            cid: Number,
            requestDate: Date,
            characterName: String,
            playerForename: String,
            playerMiddlename: String,
            playerSurname: String,
            faction: String,
            race: String,
            groupname: String,
            characterSkills: [{
                id: Number,
                name: String,
                cost: Number
            }],
            occupationalSkills: [{
                id: Number,
                name: String,
                tier: Number,
                script: Boolean
            }]
        },
    },
    eventTickets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EventTicket'
    }]
})

userSchema.plugin(passportLocalMongoose);

userSchema.post('findOneAndUpdate', async function(doc) {
    if (doc) {
        await eventBooking.updateMany({ user: doc._id }, { $set: { displayBooking: doc.displayBookings, firstname: doc.firstname, surname: doc.surname, playerId: doc.playerId } });
        const events = await Event.find({ $in: { attendees: { user: doc._id } } }).populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } });
        for (e of events) {
            for (attendee of e.attendees) {
                if (attendee.user?.equals(doc._id)) {
                    const pull = await Event.findByIdAndUpdate(e._id, {
                        $pull: {
                            attendees: { booking: attendee.booking }
                        }
                    })
                    attendee.display = doc.displayBookings;
                    if (e.eventHost.eventSystem === "Lorien Trust") {
                        attendee.icName = doc.lorienTrust?.character?.characterName;
                        attendee.faction = doc.lorienTrust?.character?.faction;
                    }
                    const push = await Event.findByIdAndUpdate(e._id, {
                        $push: {
                            attendees: {...attendee }
                        }
                    })
                }
            }
        }
    }
})

module.exports = mongoose.model('User', userSchema);