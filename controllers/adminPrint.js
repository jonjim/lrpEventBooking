const Event = require('../models/event');
const siteConfig = require('../models/siteConfig');
const pdfService = require('../utils/pdf');
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