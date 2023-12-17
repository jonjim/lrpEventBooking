const Event = require('../models/event');
const EventTicket = require('../models/eventTicket');
const EventBooking = require('../models/eventBooking');
const EventHost = require('../models/eventHost');
const User = require('../models/user');
const mongoose = require('mongoose');
const { array } = require('joi');
const emailService = require('../utils/email');
const crypto = require('crypto');
const { systemCheck } = require('../utils/systemCheck');

module.exports.upcomingEvents = async(req, res, next) => {
    const eventList = await Event.find({ visible: true, cancelled: false, eventEnd: { $gte: new Date() } }).populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } }).sort({ eventStart: 'asc' });
    const meta = {
        title: 'LARP Event Bookings: Upcoming Events',
        description: 'LARP Event Bookings - Event information and booking for LRP events across the United Kingdom',
        path: '/'
    }
    res.render('events/list', {
        title: 'Upcoming Events',
        events: eventList,
        meta
    })
};

module.exports.showEvent = async(req, res) => {
    const event = await Event.findById(req.params.id).populate('eventTickets').populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } });
    const meta = {
        title: `LARP Event Bookings: ${event.name}`,
        description: `${event.promoDescription}`,
        path: `/events/${event._id}`
    }
    res.render('events/show', { title: event.name, event, meta });
}

module.exports.showEventBooking = async(req, res, next) => {
    const event = await Event.findById(req.params.id).populate('eventTickets').populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } });
    const eventTickets = await event.eventTickets.filter(a => new Date(a.availableFrom).toLocaleDateString() <= new Date().toLocaleDateString() && new Date(a.availableTo).toLocaleDateString() >= new Date().toLocaleDateString() && a.available)
    const changeUser = typeof req.query.alt == 'undefined' || !req.query.alt ? false : res.locals.hostGroups.includes(req.user.role) ? true : false;
    const manual = typeof req.query.manual == 'undefined' || !req.query.manual ? false : res.locals.hostGroups.includes(req.user.role) ? true : false;
    if (eventTickets.length > 0 && event.allowBookings) {
        if (systemCheck(req, res, event.eventHost.eventSystem, req.user))
            return res.render('events/book', { title: event.name, event, changeUser, manual });
    }
        req.flash('error', `${event.name} is not currently open for bookings!`);
        res.redirect(`/events/${event._id}`)
}

module.exports.editEventBooking = async(req, res, next) => {
    const eventBooking = await EventBooking.findById(req.params.id).populate('event').populate('eventTickets').populate({ path: 'event', populate: { path: 'eventTickets' } }).populate({ path: 'event', populate: { path: 'eventHost'}}).populate({path: 'event.eventHost',populate:{ path:'eventSystem'}});
    const eventTickets = await eventBooking.event.eventTickets.filter(a => new Date(a.availableFrom).toLocaleDateString() <= new Date().toLocaleDateString() && new Date(a.availableTo).toLocaleDateString() >= new Date().toLocaleDateString() && a.available && ['mealticket', 'mealticketchild', 'playerbunk', 'monsterbunk', 'staffbunk'].includes(a.ticketType) && !eventBooking.eventTickets.find(t => t._id.equals(a._id)))
    if (req.user._id.equals(eventBooking.user._id))
        res.render('events/editBooking', { title: 'Edit Event Booking', eventBooking, eventTickets });
    else {
        req.flash('error', 'You can not edit the selected booking');
        res.redirect('/account/bookings')
    }
}

module.exports.updateEventBooking = async(req, res, next) => {
    const eventBooking = await EventBooking.findById(req.params.id).populate('event').populate('eventTickets').populate({ path: 'event', populate: { path: 'eventTickets' } });
    if (req.user._id.equals(eventBooking.user._id)) {
        const ticket = await EventTicket.findById(req.body.eventTicket);
        await EventBooking.findByIdAndUpdate(req.params.id, { $push: { eventTickets: req.body.eventTicket }, totalDue: eventBooking.totalDue + ticket.cost, paid: eventBooking + ticket.cost == eventBooking.totalPaid })
        req.flash('success', 'Event Booking Updated');
        res.redirect(`/events/booking/${req.params.id}`)
    } else
        req.flash('error', 'You can not edit the selected booking');
    res.redirect('/account/bookings')
}

module.exports.cancelEventBooking = async(req, res, next) => {
    const booking = await EventBooking.findById(req.params.id).populate('user').populate('event');
    if (booking.user._id.equals(req.user._id) && !booking.paid) {
        await EventBooking.findByIdAndDelete(req.params.id);
    } else
        req.flash('error', 'You do not have permission to cancel this booking')
    if (req.query.rebook)
        res.redirect(`/events/${booking.event._id}/book`)
    else
        res.redirect('/account/bookings');
}

module.exports.createEventBooking = async(req, res, next) => {
    const manual = typeof req.body.firstname == 'undefined' ? false : true;
    const user = await User.findOne({ username: req.body.username ? req.body.username : req.user.username })
    if (!user && !manual) {
        req.flash('error', 'Unable to find requested user');
        res.redirect(`/events/${req.params.id}/book?alt=true`)
    }
    let ticketSelected = [];
    ticketSelected.push(req.body.ticketSelected.playerTickets);
    ticketSelected.push(req.body.ticketSelected.playerBunks);
    ticketSelected.push(req.body.ticketSelected.playerMeal);
    ticketSelected.push(req.body.ticketSelected.monsterTicket);
    ticketSelected.push(req.body.ticketSelected.monsterBunks);
    ticketSelected.push(req.body.ticketSelected.monsterMeal);
    ticketSelected.push(req.body.ticketSelected.staffTicket);
    ticketSelected.push(req.body.ticketSelected.staffBunks);
    ticketSelected.push(req.body.ticketSelected.staffMeal);
    const tickets = await EventTicket.find({ _id: { $in: ticketSelected } });

    const booking = await new EventBooking({
        event: req.params.id,
        totalDue: tickets.reduce((acc, t) => acc + t.cost, 0),
    })
    if (manual) {
        booking.firstname = req.body.firstname;
        booking.surname = req.body.surname;
        displayBooking = false;
    } else {
        booking.user = user._id;
        booking.originalUser = user._id;
        booking.firstname = user.firstname;
        booking.surname = user.surname;
        displayBooking = user.displayBookings;
    }
    booking.eventTickets.push(...tickets);
    if (booking.totalDue == 0) {
        booking.paid = true;
        booking.bookingPaid = Date.now()
    }
    await booking.save();
    var eventBooking = await EventBooking.findById(booking._id).populate('eventTickets').populate('user').populate('event');
    var event = await Event.findById(eventBooking.event,{strict:false}).populate('eventHost').populate({path: 'eventHost', populate:{ path: 'eventSystem'}});
    if (booking.totalDue == 0) {
        for (ticket of eventBooking.eventTickets.filter(e => !['mealticket', 'mealticketchild', 'playerbunk', 'monsterbunk', 'staffbunk'].includes(e.ticketType))) {
            const characterData = eventBooking.user[event.eventHost.eventSystem.systemRef]; 
            const attendeeData = {
                user: eventBooking.user,
                booking: eventBooking,
                ticketType: ticket.ticketType,
                display: req.user.displayBookings,
                surname: eventBooking.surname,
                firstname: eventBooking.firstname,
                icName: manual ? req.body.characterName : characterData.character.characterName
            };
            if (typeof event.eventHost.eventSystem.customFields !== 'undefined') {
                for (field of event.eventHost.eventSystem.customFields.filter(a => a.display)) {
                    if (field.section === 'player')
                        attendeeData[field.name] = characterData[field.name];
                    else if (field.section === 'character')
                        attendeeData[field.name] = characterData.character[field.name];
                }
            }
            // event.attendees.push({
            //     user: eventBooking.user,
            //     booking: eventBooking,
            //     ticketType: ticket.ticketType,
            //     display: req.user.displayBookings,
            //     surname: eventBooking.surname,
            //     firstname: eventBooking.firstname,
            //     icName: manual ? req.body.characterName : characterData.icName,
            //     faction: manual ? req.body.faction : characterData.faction
            // })
            event.attendees.push(attendeeData);
        }
        event.save();
    }
    if (booking.paid) {
        res.render('email/paidBooking', { booking: eventBooking }, async function(err, str) {
            if (!manual) emailService.sendEmail(eventBooking.user.username, `Event booking for ${eventBooking.event.name}`, str);
            if (req.body.username || manual)
                return res.redirect(`/admin/events/${req.params.id}/manage`)
            else
                return res.redirect('/account/bookings');
        })
    } else {
        res.render('email/eventBooking', { booking: eventBooking }, async function(err, str) {
            if (!manual) emailService.sendEmail(eventBooking.user.username, `Event booking for ${eventBooking.event.name}`, str);
            if (req.body.username || manual)
                return res.redirect(`/admin/bookings/${booking._id}`)
            else
                return res.redirect(`/account/pay/${booking._id}`);
        })
    }
}

module.exports.giftBooking = async(req, res, next) => {
    const user = await User.findOne({ username: req.body.username });
    if (user.length > 0) {
        if (user._id.equals(req.user._id))
            res.sendStatus(418);
        const booking = await EventBooking.findById(req.body.eventBooking).populate('user');
        await EventBooking.findByIdAndUpdate(req.body.eventBooking, {
            user: user._id,
            firstname: user.firstname,
            surname: user.surname,
            displayBooking: user.displayBookings,
        });
        const event = await Event.findById(booking.event);
        try {
            for (attendee of event.attendees) {
                if (attendee.booking.equals(booking._id)) {
                    const pull = await Event.findByIdAndUpdate(event._id, {
                        $pull: {
                            attendees: { booking: attendee.booking }
                        }
                    })
                    try {
                        attendee.user = user._id
                        attendee.display = user.displayBookings;
                        attendee.firstname = user.firstname;
                        attendee.surname = user.surname;
                        attendee.icName = user.character.characterName;
                        attendee.faction = user.character.faction;
                    } catch {
                        attendee.user = user._id
                        attendee.display = user.displayBookings;
                        attendee.firstname = user.firstname;
                        attendee.surname = user.surname;
                        attendee.icName = '';
                        attendee.faction = '';
                    }
                    const push = await Event.findByIdAndUpdate(event._id, {
                        $push: {
                            attendees: {...attendee }
                        }
                    })
                }
            }
        } catch (error) {
            console.log(error)
        }
        const eventBooking = await EventBooking.findById(req.body.eventBooking).populate('user').populate('originalUser').populate('event');
        res.render('email/giftBooking', { booking: eventBooking }, async function(err, str) {

            emailService.sendEmail(eventBooking.user.username, `Event booking for ${eventBooking.event.name}`, str);
            req.flash('success', 'Your booking has been gifted')
            res.sendStatus(200);
        })
    } else
        res.sendStatus(404);
}