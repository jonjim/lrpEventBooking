const Event = require('../models/lrpEvent');
const siteConfig = require('../models/siteConfig');
const pdfService = require('../utils/pdf');
const emailService = require('../utils/email')
const ExpressError = require('../utils/ExpressError');

module.exports.pidEvent = async(req, res, next) => {
    const event = await Event.findById(req.params.id).populate('eventHost').populate({ path: 'attendees', populate: { path: 'user' } });
    let csv = 'Player ID,Player Firstname,Player Surname,DOB,Booking As\n'
    for (attendee of event.attendees) {
        let ticketType;
        if (['player', 'playerChild'].includes(attendee.ticketType)) ticketType = "Player";
        else if (['monster', 'monsterChild'].includes(attendee.ticketType)) ticketType = "Monster";
        else if (['staff'].includes(attendee.ticketType)) ticketType = "Staff";
        csv += `${attendee.user.lorienTrust.playerId},${attendee.user.firstname},${attendee.user.surname},${new Date(attendee.user.dob).toLocaleDateString()},${ticketType}\n`
    }
    res.attachment(`${event.name} Pid.csv`).send(csv);
};

module.exports.signinEvent = async(req, res, next) => {
    const event = await Event.findById(req.params.id).populate('eventHost').populate('eventTickets');
    const config = await siteConfig.find();
    if (req.user.eventHosts.filter(a => a._id.equals(event.eventHost._id)).length > 0 || ['admin', 'superAdmin'].includes(req.user.role)) {
        if (req.query.preview) {
            res.render('print/eventSignin', { title: `Manage ${event.name}`, event, config: config[0] });
        }
        else {
            res.render('print/eventSignin', { title: `Manage ${event.name}`, event, config: config[0] }, async function (err, str) {
                if (err) throw new ExpressError(err, 500)
                await pdfService.sendPDF(res, str, `${event.name} Signin.pdf`);
            })
        }
    } else {
        req.flash('error', `You do not have permission to manage ${event.name}`)
        return res.redirect('/');
    }
};

module.exports.medicalEvent = async(req, res, next) => {
    const event = await Event.findById(req.params.id).populate('eventHost').populate({ path: 'attendees', populate: { path: 'user' } });
    if (req.user.eventHosts.filter(a => a._id.equals(event.eventHost._id)).length > 0 || ['admin', 'superAdmin'].includes(req.user.role)) {
        if (req.query.preview) {
            res.render('print/eventMedical', { title: `Manage ${event.name}`, event });
        }
        else {
            res.render('print/eventMedical', { title: `Manage ${event.name}`, event }, async function (err, str) {
                if (err) throw new ExpressError(err, 500)
                await pdfService.sendConfidentialPDF(res, str, `${event.name} Medical.pdf`);
            })
        }
    } else {
        req.flash('error', `You do not have permission to manage ${event.name}`)
        return res.redirect('/');
    }
};

module.exports.dietaryEvent = async(req, res, next) => {
    const event = await Event.findById(req.params.id).populate('eventHost').populate({ path: 'attendees', populate: { path: 'user' } }).populate({ path: 'attendees', populate: { path: 'booking' } });
    if (req.user.eventHosts.filter(a => a._id.equals(event.eventHost._id)).length > 0 || ['admin', 'superAdmin'].includes(req.user.role)) {
        if (req.query.preview) {
            res.render('print/eventDietary', { title: `Manage ${event.name}`, event });
        }
        else {
            res.render('print/eventDietary', { title: `Manage ${event.name}`, event }, async function (err, str) {
                if (err) throw new ExpressError(err, 500)
                    await pdfService.generatejsPDF(res,str,`${event.name} Dietary.pdf`)
                //await pdfService.sendConfidentialPDF(res, str, `${event.name} Dietary.pdf`);
            })
        }
    } else {
        req.flash('error', `You do not have permission to manage ${event.name}`)
        return res.redirect('/');
    }
};

module.exports.dietaryEventToCSV = async (req, res, next) => {
    const event = await Event.findById(req.params.id).populate('eventHost').populate({ path: 'attendees', populate: { path: 'user' } }).populate({ path: 'attendees', populate: { path: 'booking' } });
    if (req.user.eventHosts.filter(a => a._id.equals(event.eventHost._id)).length > 0 || ['admin', 'superAdmin'].includes(req.user.role)) {
        let csv = 'Player ID,Player Firstname,Player Surname,Email,Starter,Main,Dessert,Allergy Notes\n'
        for (attendee of event.attendees) {
            if (attendee.user) {
                let starter = '';
                let main = '';
                let dessert = '';
                if (attendee.booking.cateringChoices) {
                    var choices = attendee.booking.cateringChoices;
                    if (choices.length == 3) {
                        starter = attendee.booking.cateringChoices[0].choice;
                        main = attendee.booking.cateringChoices[1].choice;
                        dessert = attendee.booking.cateringChoices[2].choice
                    }
                }
            }
            try {
                csv += `${attendee.user?.lorienTrust?.playerId ?? 0},"${attendee.user.firstname}","${attendee.user.surname}","${attendee.user.username}","${starter}","${main}","${dessert}","${attendee.user.allergyDietary}"\n`
            }
            catch (ex) {
                console.log(req.user._id)
            }
        }
        return res.attachment(`${event.name} Dietary.csv`).send(csv);
    } else {
        req.flash('error', `You do not have permission to manage ${event.name}`)
        return res.redirect('/');
    }
}

module.exports.attendeesEvent = async(req, res, next) => {
    const event = await Event.findById(req.params.id).populate('eventHost').populate({ path: 'attendees', populate: { path: 'user' } }).populate({ path: 'eventHost', populate: { path: 'eventSystem' } });

    if (req.user.eventHosts.filter(a => a._id.equals(event.eventHost._id)).length > 0 || ['admin', 'superAdmin'].includes(req.user.role)) {
        if (req.query.preview) {
            res.render('print/eventAttendees', { title: `Manage ${event.name}`, event });
        }
        else {
            res.render('print/eventAttendees', { title: `Manage ${event.name}`, event }, async function (err, str) {
                if (err) throw new ExpressError(err, 500)
                await pdfService.sendConfidentialPDF(res, str, `${event.name} Attendees.pdf`);
        })
    }
    } else {
        req.flash('error', `You do not have permission to manage ${event.name}`)
        return res.redirect('/');
    }
};

module.exports.eventPack = async(req,res,next) => {
    const lookupEvent = await Event.findById(req.params.id).populate('eventHost').populate({path:'eventHost', populate: {path: 'eventSystem'}}).populate({ path: 'attendees', populate: { path: 'user' } });
    if (req.user.eventHosts.filter(a => a._id.equals(lookupEvent.eventHost._id)).length > 0 || ['admin', 'superAdmin'].includes(req.user.role)) {
        if (req.query.preview) {
            const event = await Event.findById(req.params.id).populate('eventHost').populate({path:'eventHost', populate: {path: 'eventSystem'}}).populate({ path: 'attendees', populate: { path: 'user' } });
            return res.render('print/eventPack', { title: `Event Pack: ${event.name}`, event });
        }
        else {
            req.body.returnPack.timeInOut.arrivalTimeIn = req.body.returnPack.timeInOut?.arrivalTimeIn ? `${lookupEvent.eventStart.toISOString().split('T')[0]}T${req.body.returnPack.timeInOut?.arrivalTimeIn}:00.000Z` : undefined;
            req.body.returnPack.timeInOut.departureTimeOut = req.body.returnPack.timeInOut?.departureTimeOut ? `${(lookupEvent.eventEnd == lookupEvent.eventStart ? new Date(lookupEvent.eventEnd) + 1 : lookupEvent.eventEnd).toISOString().split('T')[0]}T${req.body.returnPack.timeInOut?.departureTimeOut}:00.000Z` : undefined;
            req.body.returnPack.timeInOut.dailyTimeIn = req.body.returnPack.timeInOut?.dailyTimeIn ? `${lookupEvent.eventStart.toISOString().split('T')[0]}T${req.body.returnPack.timeInOut?.dailyTimeIn}:00.000Z` : undefined;
            req.body.returnPack.timeInOut.dailyTimeOut = req.body.returnPack.timeInOut?.dailyTimeOut ? `${lookupEvent.eventEnd.toISOString().split('T')[0]}T${req.body.returnPack.timeInOut?.dailyTimeOut}:00.000Z` : undefined;
             
            const event = await Event.findByIdAndUpdate(req.params.id, req.body,{new:true}).populate('eventHost').populate({path:'eventHost', populate: {path: 'eventSystem'}}).populate({ path: 'attendees', populate: { path: 'user' } });
            res.render('print/eventPack', { title: `Manage ${event.name}`, event }, async function (err, str) {
                if (err) throw new ExpressError(err, 500)
                if (req.query.email){
                    let eventPack = await pdfService.generatePDF(str);
                    res.render('email/eventPack', { event, title: 'Your event pack is ready, take a look to get ready for your event' }, async function(err, email) {
                        for (attendee of event.attendees) {
                            if (attendee.user)
                                await emailService.sendEmail(attendee.user.username, `${event.name} Event Pack`, email,eventPack,`${event.name} Event Pack.pdf`);
                        }
                        return res.sendStatus(200);
                    })
                }
                else{
                    await pdfService.sendPDF(res, str, `${event.name} Event Pack.pdf`);
                }
            })
        }
    } else {
        req.flash('error', `You do not have permission to manage ${event.name}`)
        return res.redirect('/');
    }
}

module.exports.encounters = async(req,res,next) => {
    const lookupEvent = await Event.findById(req.params.id).populate('eventHost').populate({path:'eventHost', populate: {path: 'eventSystem'}}).populate('encounters').populate({path:'encounters', populate: {path:'monsters', populate:'monster'}});
    if (req.user.eventHosts.filter(a => a._id.equals(lookupEvent.eventHost._id)).length > 0 || ['admin', 'superAdmin'].includes(req.user.role)) {
        if (req.query.preview) {
            return res.render('print/encounters', { title: `Encounters: ${lookupEvent.name}`, event: lookupEvent });
        }
        else {
            res.render('print/encounters', { title: `Encounter ${lookupEvent.name}`, event:lookupEvent }, async function (err, str) {
                if (err) throw new ExpressError(err, 500)
                    await pdfService.sendPDF(res, str, `${lookupEvent.name} Encounters.pdf`);
            })
        }
    } else {
        req.flash('error', `You do not have permission to manage ${lookupEvent.name}`)
        return res.redirect('/');
    }
}