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
    twistedTales: {
        character: {
            characterName: String
        }
    },
    eldritchDays: {
        character: {
            characterName: String
        }
    },
    jadeThrone: {
        character: {
            characterName: String,
            clan: String
        }
    },
    eventTickets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EventTicket'
    }]
})

userSchema.virtual('jadeThrone.character.faction')
.set(function () {
    return this.jadeThrone.character.clan;
})

userSchema.plugin(passportLocalMongoose);

userSchema.post('findOneAndUpdate', async function(doc) {
    if (doc) {
        await eventBooking.updateMany({ user: doc._id }, { $set: { displayBooking: doc.displayBookings, firstname: doc.firstname, surname: doc.surname, playerId: doc.playerId } });
        const events = await Event.find({ $in: { attendees: { user: doc._id } } }, {strict:false}).populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } });
        for (e of events) {
            for (attendee of e.attendees) {
                if (attendee.user?.equals(doc._id)) {
                    await Event.findByIdAndUpdate(e._id, {
                        $pull: {
                            attendees: { booking: attendee.booking }
                        }
                    })
                    const attendeeData = JSON.parse(JSON.stringify(attendee))
                    attendeeData.display = doc.displayBookings;
                    const characterData = doc[e.eventHost.eventSystem.systemRef]; 
                    attendeeData.customFields = [];
                    if (typeof e.eventHost.eventSystem.customFields !== 'undefined') {
                        for (field of e.eventHost.eventSystem.customFields.filter(a => a.display)) {
                            if (field.section === 'player') 
                                attendeeData.customFields.push({
                                    name: field.name,
                                    value:characterData[field.name]
                                });
                            else if (field.section === 'character')
                                attendeeData.customFields.push({
                                    name: field.name,
                                    value:characterData.character[field.name]
                                });
                        }
                    }
                    await Event.findByIdAndUpdate(e._id, {
                        $push: {
                            attendees: {...attendeeData }
                        }
                    }, {strict: false})
                }
            }
        }
    }
})

module.exports = mongoose.model('User', userSchema);