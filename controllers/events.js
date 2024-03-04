const Event = require('../models/lrpEvent');
const EventTicket = require('../models/eventTicket');
const EventBooking = require('../models/eventBooking');
const User = require('../models/user');
const mongoose = require('mongoose');
const emailService = require('../utils/email');
const { systemCheck, attendeeUpdate } = require('../utils/systemCheck');
const ics = require('ics');
const moment = require("moment")
const RSS = require('rss');
const pdfService = require('../utils/pdf');
const turndownService  = require('turndown');


module.exports.upcomingEvents = async(req, res, next) => {
    const eventList = await Event.find({ visible: true, cancelled: false, eventEnd: { $gte: new Date() } }).populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } }).sort({ eventStart: 'asc' });
    const meta = {
        title: 'LRPTickets.co.uk : Upcoming Events',
        description: 'LRPTickets.co.uk - Event information and booking for LRP events across the United Kingdom',
        path: '/'
    }
    res.render(req.query.view == 'calendar' ? 'events/calendar' : 'events/list', {
        title: 'Upcoming Events',
        events: eventList.filter(a => a.eventHost.eventSystem.active == true),
        meta
    })
}; 

module.exports.icsEvents = async(req,res,next) => {
    let eventList = await Event.find({ visible: true, cancelled: false, eventEnd: { $gte: new Date() } }).populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } }).sort({ eventStart: 'asc' });
    eventList = eventList.filter(a => a.eventHost.eventSystem.active == true)
    const icsList = [];
    function stripHtml(html){
        return html.replace('<p>','').replace('</p>')
    }
    for (e of eventList.filter(a => a.eventHost.eventSystem.active == true)){
        icsList.push({
            title: e.name,
            start: moment(e.eventStart).format('YYYY-M-D-H-m').split("-").map((a) => parseInt(a)),
            end: moment(e.eventEnd).format('YYYY-M-D-H-m').split("-").map((a) => parseInt(a)),
            description: stripHtml(e.promoDescription),
            location: e.location,
            url: `${res.locals.rootUrl}/events/${e._id}`,
            organizer: {
                name: e.eventHost.display ? `${e.eventHost.eventSystem.name}: ${e.eventHost.name}` : e.eventHost.eventSystem.name,
                email: e.eventHost.contactAddress
            },
            uid: `${e._id}`
        })
    }
    res.contentType("text/calendar");
    res.send(ics.createEvents(icsList).value);
}

module.exports.rssEvents = async(req,res,next) => {
    let eventList = await Event.find({ visible: true, cancelled: false, eventEnd: { $gte: new Date() } }).populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } }).sort({ eventStart: 'asc' });
    if (req.query.system)
        eventList = eventList.filter(a => a.eventHost.eventSystem.active == true && a.eventHost.eventSystem.systemRef == req.query.system)
    else if (req.query.host)
        eventList = eventList.filter(a => a.eventHost.eventSystem.active == true && a.eventHost._id.equals(req.query.host))
    else
        eventList = eventList.filter(a => a.eventHost.eventSystem.active == true)
    var feed = new RSS({
        title: res.locals.config.siteName,
        description: res.locals.config.siteDescription,
        site_url: res.locals.rootUrl,
        image_url: res.locals.config.siteLogo.url,
        feed_url: `${res.locals.rootUrl}/rss`
    })
    for (lrpEvent of eventList){
        feed.item({
            title: lrpEvent.name,
            description: lrpEvent.promoDescription,
            url: `${res.locals.rootUrl}/events/${lrpEvent._id}`,
            guid: lrpEvent._id,
            date: lrpEvent.eventStart
        })
    }

    res.contentType("application/xml");
    res.send(feed.xml({indent: true}));
}

module.exports.showEvent = async (req, res) => {
    let turndownS = new turndownService();
    const event = await Event.findById(req.params.id).populate('eventTickets').populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } });
    if (event.eventHost.eventSystem.active || res.locals.adminGroups.includes(res.locals.currentUser.role) ||
        (res.locals.hostGroups.includes(res.locals.currentUser.role) && (res.locals.currentUser.eventHosts.includes(event.eventHost._id) || res.locals.currentUser.eventSystems.includes(event.eventHost.eventSystem._id)))) {
        const meta = {
            title: `${event.eventHost.eventSystem.name}${event.eventHost.display ? ` - ${event.eventHost.name}`: ''}: ${event.name}`,
            description: new turndownService().turndown(event.promoDescription),
            path: `/events/${event._id}`,
            logo: `${res.locals.rootUrl}/ogcard?event=${event._id}`
        }
        if (!event.eventHost.eventSystem.active)
            req.flash('error','Please note this event is not visible to the public!')
        return res.render('events/show', { title: event.name, event, meta: meta });
    }
    else {
        req.flash('error', 'Could not find the selected event!')
        return res.redirect('/');
    }
}

module.exports.showEventBooking = async(req, res, next) => {
    const event = await Event.findById(req.params.id).populate('eventTickets').populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } });
    const eventTickets = await event.eventTickets.filter(a => new Date(a.availableFrom) <= new Date() && new Date(a.availableTo) >= new Date() && a.available)
    const changeUser = typeof req.query.alt == 'undefined' || !req.query.alt ? false : res.locals.hostGroups.includes(req.user.role) ? true : false;
    const manual = typeof req.query.manual == 'undefined' || !req.query.manual ? false : res.locals.hostGroups.includes(req.user.role) ? true : false;
    if (eventTickets.length > 0) {
        if (systemCheck(req, res, event.eventHost.eventSystem, req.user))
            return res.render('events/book', { title: event.name, event, changeUser, manual });
    }
        req.flash('error', `${event.name} is not currently open for bookings!`);
        return res.redirect(`/events/${event._id}`)
}

module.exports.editEventBooking = async(req, res, next) => {
    const eventBooking = await EventBooking.findById(req.params.id).populate('event').populate('eventTickets').populate({ path: 'event', populate: { path: 'eventTickets' } }).populate({ path: 'event', populate: { path: 'eventHost'}}).populate({path: 'event.eventHost',populate:{ path:'eventSystem'}});
    const eventTickets = await eventBooking.event.eventTickets.filter(a => new Date(a.availableFrom) <= new Date() && new Date(a.availableTo) >= new Date() && a.available && ['mealticket', 'mealticketchild', 'playerbunk', 'monsterbunk', 'staffbunk'].includes(a.ticketType) && !eventBooking.eventTickets.find(t => t._id.equals(a._id)))
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
    const booking = await EventBooking.findById(req.params.id).populate('user').populate('event').populate('eventTickets');
    if (booking.user._id.equals(req.user._id) && !booking.paid) {
        res.render('email/eventBookingCancelled', { booking: booking, title: "Sorry you can't make it this time!" }, async function(err, str) {
            if (!req.query.rebook) emailService.sendEmail(booking.user.username, `Event booking cancelled for ${booking.event.name}`, str);
            await EventBooking.findByIdAndDelete(req.params.id);
        })
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

    let event = await Event.findById(req.params.id,{strict:false}).populate('eventHost').populate({path: 'eventHost', populate:{ path: 'eventSystem'}});

    const booking = await new EventBooking({
        event: req.params.id,
        totalDue: tickets.reduce((acc, t) => acc + t.cost, 0),
    })
    if (manual) {
        booking.firstname = req.body.firstname;
        booking.surname = req.body.surname;
        booking.displayBooking = false;
    } else {
        booking.user = user._id;
        booking.originalUser = user._id;
        booking.firstname = user.firstname;
        booking.surname = user.surname;
        booking.displayBooking = user.displayBookings;
    }
    booking.eventTickets.push(...tickets);
    if (booking.totalDue == 0) {
        booking.paid = (booking.bookingType == 'player' && event.playerSpaces > 0) || (booking.bookingType == 'monster' && event.monsterSpaces > 0) || (booking.bookingType == 'staff' && event.staffSpaces > 0) ? true : false;
        booking.displayBooking = user.displayBookings;
        booking.bookingPaid = Date.now()
    }

    await booking.save();
    const eventBooking = await EventBooking.findById(booking._id).populate('event').populate('eventTickets').populate('user').populate({ path: 'event', populate: { path: 'eventTickets' } }).populate({ path: 'event', populate: { path: 'eventTickets' } }).populate({ path: 'event', populate: { path: 'eventHost',populate: {path: 'eventSystem'} } });
    if (booking.totalDue == 0 && booking.paid) {
        await Event.findByIdAndUpdate(eventBooking.event, {
            $push: {
                attendees: { ...await attendeeUpdate(event.eventHost.eventSystem,eventBooking)}
            }
        }, {strict: false})
    }
    if (booking.totalDue == 0) {
        if (!manual && booking.paid){
            await res.render('print/ticket', { eventBooking, title: `Event Ticket` }, async function (err, ticket) {
                await pdfService.generatePDF(ticket)
                    .then(async (ticketPdf) => {
                        res.render('email/paidBooking', { booking: eventBooking, title: 'Your payment and ticket wait inside' }, async function (err, str) {
                            emailService.sendEmail(eventBooking.user.username, `Payment receipt for ${eventBooking.event.name}`, str, ticketPdf ,`ticket.pdf`);
                        })
                })
            })
        }
        if (req.body.username || manual)
                return res.redirect(`/admin/events/${req.params.id}/manage`)
            else
                return res.redirect('/account/bookings');
    } else {
        res.render('email/eventBooking', { booking: eventBooking, title: 'Yay! We look forward to seeing you at this event!' }, async function(err, str) {
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
        res.render('email/giftBooking', { booking: eventBooking, title: 'Somone has sent you a very special gift!' }, async function(err, str) {

            emailService.sendEmail(eventBooking.user.username, `Event booking for ${eventBooking.event.name}`, str);
            req.flash('success', 'Your booking has been gifted')
            res.sendStatus(200);
        })
    } else
        res.sendStatus(404);
}

module.exports.eventBookingTicket = async(req,res,next) => {
    const eventBooking = await EventBooking.findById(req.params.id).populate('event').populate('eventTickets').populate('user').populate({ path: 'event', populate: { path: 'eventTickets' } }).populate({ path: 'event', populate: { path: 'eventTickets' } }).populate({ path: 'event', populate: { path: 'eventHost',populate: {path: 'eventSystem'} } });
    if (req.query.preview)
        return res.render('print/ticket', {eventBooking,title:`Event Ticket`})
    await res.render('print/ticket', {eventBooking,title:`Event Ticket`}, async function (err, ticket){
        pdfService.sendPDF(res,ticket,`${eventBooking._id}.pdf`);
    })
}

module.exports.eventSignIn = async(req,res,next) => {
    res.render('events/signin',{title:'Event Signin'})
}

module.exports.eventSignInSearch = async (req, res, next) => {
    const booking = await EventBooking.findById(req.params.id).populate('event').populate('eventTickets').populate('user').populate({ path: 'event', populate: { path: 'eventTickets' } }).populate({ path: 'event', populate: { path: 'eventTickets' } }).populate({ path: 'event', populate: { path: 'eventHost', populate: { path: 'eventSystem' } } });
    return res.json(booking);
}

module.exports.cateringSearch = async(req,res,next) => {
    const event = await Event.findById(req.params.id);
    const bookingId = event.attendees.find(a => a.user.equals(res.locals.currentUser._id));
    if (bookingId)
        return res.redirect(`/events/booking/${bookingId.booking}/catering`)
    else{
        req.flash('error','You do not have a booking for this event!')
        return res.redirect('/account/bookings');
    }
}

module.exports.cateringEdit = async(req,res,next) => {
    const booking = await EventBooking.findById(req.params.id).populate('event');
    if (booking.user.equals(res.locals.currentUser._id)){
        return res.render('events/catering', {title:'Catering Choices',booking})
    }
    else
    {
        req.flash('error','You do not have a booking for this event!')
        return res.redirect(`/events/${req.params.id}`);
    }
}

module.exports.cateringSubmit = async(req,res,next) => {
    const booking = await EventBooking.findById(req.params.id).populate('event').populate('user');
    if (booking.user.equals(res.locals.currentUser._id)){
        booking.cateringChoices = req.body.cateringChoices;
        booking.save();
        res.render('email/cateringChoices', { booking: booking, title: `Your catering choices for ${booking.event.name}` }, async function(err, str) {
            emailService.sendEmail(booking.user.username, `Your catering choices for ${booking.event.name}`, str);
            req.flash('success','Catering requests updated');
            return res.redirect('/account/bookings');
        })
    }
    else
    {
        req.flash('error','You do not have a booking for this event!')
        return res.redirect(`/events/${req.params.id}`);
    }
}