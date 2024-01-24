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
        csv += `${attendee.user.playerId},${attendee.user.firstname},${attendee.user.surname},${new Date(attendee.user.dob).toLocaleDateString()},${ticketType}\n`
    }
    res.attachment(`${event.name} Pid.csv`).send(csv);
};

module.exports.signinEvent = async(req, res, next) => {
    const event = await Event.findById(req.params.id).populate('eventHost').populate('eventTickets');
    const config = await siteConfig.find();
    if (req.user.eventHosts.filter(a => a._id.equals(event.eventHost._id)).length > 0 || ['admin', 'superAdmin'].includes(req.user.role)) {
        res.render('print/eventSignin', { title: `Manage ${event.name}`, event, config: config[0] }, async function(err, str) {
            if (err) throw new ExpressError(err, 500)
            await pdfService.sendPDF(res, str, `${event.name} Signin.pdf`);
        })
    } else {
        req.flash('error', `You do not have permission to manage ${event.name}`)
        return res.redirect('/');
    }
};

module.exports.medicalEvent = async(req, res, next) => {
    const event = await Event.findById(req.params.id).populate('eventHost').populate({ path: 'attendees', populate: { path: 'user' } });
    if (req.user.eventHosts.filter(a => a._id.equals(event.eventHost._id)).length > 0 || ['admin', 'superAdmin'].includes(req.user.role)) {
        res.render('print/eventMedical', { title: `Manage ${event.name}`, event }, async function(err, str) {
            if (err) throw new ExpressError(err, 500)
            await pdfService.sendConfidentialPDF(res, str, `${event.name} Medical.pdf`);
        })
    } else {
        req.flash('error', `You do not have permission to manage ${event.name}`)
        return res.redirect('/');
    }
};

module.exports.attendeesEvent = async(req, res, next) => {
    const event = await Event.findById(req.params.id).populate('eventHost').populate({ path: 'attendees', populate: { path: 'user' } });
    if (req.user.eventHosts.filter(a => a._id.equals(event.eventHost._id)).length > 0 || ['admin', 'superAdmin'].includes(req.user.role)) {
        res.render('print/eventAttendees', { title: `Manage ${event.name}`, event }, async function(err, str) {
            if (err) throw new ExpressError(err, 500)
            await pdfService.sendConfidentialPDF(res, str, `${event.name} Attendees.pdf`);
        })
    } else {
        req.flash('error', `You do not have permission to manage ${event.name}`)
        return res.redirect('/');
    }
};

module.exports.eventPack = async(req,res,next) => {
    const event = await Event.findById(req.params.id).populate('eventHost').populate({path:'eventHost', populate: {path: 'eventSystem'}}).populate({ path: 'attendees', populate: { path: 'user' } });
    if (req.user.eventHosts.filter(a => a._id.equals(event.eventHost._id)).length > 0 || ['admin', 'superAdmin'].includes(req.user.role)) {
        if (req.query.preview) {
            const event = await Event.findById(req.params.id).populate('eventHost').populate({path:'eventHost', populate: {path: 'eventSystem'}}).populate({ path: 'attendees', populate: { path: 'user' } });
            return res.render('print/eventPack', { title: `Event Pack: ${event.name}`, event });
        }
        else {
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