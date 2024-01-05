const Event = require('../models/lrpEvent');
const eventHost = require('../models/eventHost');
const eventBooking = require('../models/eventBooking');
const EventTicket = require('../models/eventTicket');
const siteConfig = require('../models/siteConfig');
const pdfService = require('../utils/pdf');
const emailService = require('../utils/email');
const ExpressError = require('../utils/ExpressError');
const {attendeeUpdate} = require('../utils/systemCheck')

module.exports.listEvents = async(req, res, next) => {
    const eventList = await Event.find({}).populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } }).sort({ eventStart: 'desc' });
    res.render('admin/events/eventsList', {
        title: 'Event Management',
        events: eventList
    })
};

module.exports.listHostedEvents = async(req, res, next) => {
    const eventList = await Event.find({ eventHost: { $in: req.user.eventHosts } }).populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } }).sort({ eventStart: 'desc' });
    res.render('admin/events/eventsHostedList', {
        title: 'Event Management',
        events: eventList
    })
};

module.exports.manageEvent = async(req, res, next) => {
    const event = await Event.findById(req.params.id).populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } }).populate('eventTickets');
    const eventBookings = await eventBooking.find({ event: req.params.id }).populate('user').populate('eventTickets');
    const config = await siteConfig.find();
    if (req.user.eventHosts.filter(a => a._id.equals(event.eventHost._id)).length > 0 || ['admin', 'superAdmin'].includes(req.user.role)) {
        return res.render('admin/events/eventManage', { title: `Manage ${event.name}`, event, eventBookings, config: config[0] });
    } else {
        req.flash('error', `You do not have permission to manage ${event.name}`)
        return res.redirect('/');
    }
};

module.exports.eventWaitingList = async(req, res, next) => {
    const event = await Event.findById(req.params.id);
    const eventBookings = await eventBooking.find({ event: req.params.id, paid: false, payOnGate: false }).populate('user').populate('eventTickets');
    const config = await siteConfig.find();
    if (req.user.eventHosts.filter(a => a._id.equals(event.eventHost._id)).length > 0 || ['admin', 'superAdmin'].includes(req.user.role)) {
        return res.render('admin/events/eventWaitingList', { title: `Waiting List for ${event.name}`, event, eventBookings, config: config[0] });
    } else {
        req.flash('error', `You do not have permission to manage ${event.name}`)
        return res.redirect('/');
    }
};

module.exports.createEvent = async(req, res, next) => {
    req.body.event.eventApproved = false;
    req.body.event.visible = false;
    const event = await new Event(req.body.event);
    await event.save();
    res.redirect(`/admin/events/${event._id}/edit`);
};

module.exports.deleteEvent = async(req, res, next) => {
    const event = await Event.findByIdAndDelete(req.params.id);
    req.flash('success', `${event.name} has been deleted`);
    if (['admin', 'superAdmin'].includes(req.user.role))
        res.redirect('/admin/events/all')
    else
        res.redirect('/admin/events');
}

module.exports.createEventForm = async(req, res, next) => {
    //const eventHosts = await eventHost.find({});
    const eventHosts = await eventHost.find({}).populate('eventSystem');
    res.render('admin/events/eventNew', { title: 'Create new event', eventHosts });
};

module.exports.cancelEvent = async(req, res, next) => {
    const event = await Event.findByIdAndUpdate(req.params.id, { cancelled: true }).populate({ path: 'attendees', populate: { path: 'user' } });
    const bookings = await eventBooking.find({ event: event._id }).populate('user');
    res.render('email/eventCancelled', { event: event }, async function(err, str) {
        for (booking of bookings) {
            emailService.sendEmail(booking.user.username, `Event Cancelled: ${event.name}`, str);
        }
        req.flash('success', `${event.name} has been cancelled.`);
        return res.redirect('/admin/events');
    })
};

module.exports.editEvent = async(req, res) => {
    const event = await Event.findById(req.params.id).populate('eventTickets').populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } });
    const eventHosts = await eventHost.find({}).populate('eventSystem');

    res.render('admin/events/eventEdit', { title: `Edit Event: ${event.name}`, event, eventHosts });
}

module.exports.updateEvent = async(req, res, next) => {
    const { id } = req.params;
    req.body.event.allowBookings = req.body.event.allowBookings ? req.body.event.allowBookings == 'on' ? true : false : false;
    req.body.event.eventApproved = req.body.event.eventApproved ? req.body.event.eventApproved == 'on' ? true : false : false;
    req.body.event.visible = req.body.event.visible ? req.body.event.visible == 'on' ? true : false : false;
    req.body.event.overflowQueue = req.body.event.overflowQueue ? req.body.event.overflowQueue == 'on' ? true : false : false;
    const event = await Event.findByIdAndUpdate(id, {...req.body.event }, { new: true });
    if (req.file) {
        event.img = req.file;
        await event.save();
    }
    req.flash('success', `${event.name} updated!`);
    res.redirect(`/events/${req.params.id}`)
}

module.exports.createEventTicket = async(req, res, next) => {
    const event = await Event.findById(req.params.id)
    res.render('admin/events/createEventTicket', { title: `Create Ticket for: ${event.name}`, event });
}

module.exports.createEventTicketPost = async(req, res, next) => {
    const event = await Event.findById(req.params.id);
    req.body.available = req.body.available == 'on' ? true : false;
    const eventTicket = await new EventTicket(req.body);
    event.eventTickets.push(eventTicket);
    await eventTicket.save();
    await event.save();
    req.flash('success', 'Event Ticket Created');
    res.redirect(`/admin/events/${req.params.id}/edit`)
}

module.exports.editEventTicket = async(req, res, next) => {
    const ticket = await EventTicket.findById(req.params.ticketId);
    const event = await Event.findById(req.params.id);
    const bookings = await eventBooking.find({ eventTickets: req.params.ticketId });
    return res.render('admin/events/editTicket', { title: 'Edit Event Ticket', ticket, event, bookings });
}

module.exports.updateEventTicket = async(req, res, next) => {
    req.body.available = req.body.available == 'on' ? true : false;
    await EventTicket.findByIdAndUpdate(req.params.ticketId, req.body);
    req.flash('success', 'Ticket Updated');
    return res.redirect(`/admin/events/${req.params.id}/edit`)
}

module.exports.deleteEventTicket = async(req, res, next) => {
    await EventTicket.findByIdAndDelete(req.params.ticketId);
    await Event.findByIdAndUpdate(req.params.id, { $pull: { eventTickets: req.params.ticketId } });
    req.flash('success', 'Ticket Deleted');
    return res.redirect(`/admin/events/${req.params.id}/edit`)
}

module.exports.bookingCash = async(req, res, next) => {
    const booking = await eventBooking.findByIdAndUpdate(req.params.id, {...req.body }).populate('eventTickets').populate('user');
    const event = await Event.findByIdAndUpdate(booking.event, {
        $pull: {
            attendees: {
                booking: booking._id,
            }
        }
    }).populate('eventHost').populate({path: 'eventHost', populate:{ path: 'eventSystem'}});
    await Event.findByIdAndUpdate(booking.event, {
        $push: {
            attendees: { ...await attendeeUpdate(event.eventHost.eventSystem,booking)}
        }
    })
    res.redirect(`/admin/bookings/${req.params.id}`)
}

module.exports.deleteBooking = async(req, res, next) => {
    const booking = await eventBooking.findById(req.params.id).populate('event').populate({ path: 'event', populate: { path: 'eventHost' } });
    if ((['eventHost'].includes(req.user.role) && req.user.eventHosts.filter(a => a._id.equals(eventBooking.event.eventHost._id)).length > 0) || ['eventHost', 'admin', 'superAdmin'].includes(req.user.role)) {
        await eventBooking.findByIdAndDelete(req.params.id);
        res.redirect(`/admin/events/${booking.event._id}/manage`);
    } else {
        req.flash('error', `You don't have permission to delete that booking!`);
        res.redirect('/');
    }
}

module.exports.addToQueue = async(req, res, next) => {
    const booking = await eventBooking.findById(req.params.id).populate('event').populate({ path: 'event', populate: { path: 'eventHost' } });
    if ((['eventHost'].includes(req.user.role) && req.user.eventHosts.filter(a => a._id.equals(eventBooking.event.eventHost._id)).length > 0) || ['eventHost', 'admin', 'superAdmin'].includes(req.user.role)) {
        await eventBooking.findByIdAndUpdate(req.params.id, { inQueue: true });
        res.redirect(`/admin/events/${booking.event._id}/manage`);
    } else {
        req.flash('error', `You don't have permission to delete that booking!`);
        res.redirect('/');
    }
}

module.exports.delFromQueue = async(req, res, next) => {
    const booking = await eventBooking.findById(req.params.id).populate('event').populate({ path: 'event', populate: { path: 'eventHost' } });
    if ((['eventHost'].includes(req.user.role) && req.user.eventHosts.filter(a => a._id.equals(eventBooking.event.eventHost._id)).length > 0) || ['eventHost', 'admin', 'superAdmin'].includes(req.user.role)) {
        await eventBooking.findByIdAndUpdate(req.params.id, { inQueue: false });
        res.redirect(`/admin/events/${booking.event._id}/manage`);
    } else {
        req.flash('error', `You don't have permission to delete that booking!`);
        res.redirect('/');
    }
}

module.exports.cancelBookingPayment = async(req, res, next) => {
    const booking = await eventBooking.findById(req.params.id).populate('event').populate({ path: 'event', populate: { path: 'eventHost' } });
    if ((['eventHost'].includes(req.user.role) && req.user.eventHosts.filter(a => a._id.equals(eventBooking.event.eventHost._id)).length > 0) || ['eventHost', 'admin', 'superAdmin'].includes(req.user.role)) {
        await eventBooking.findByIdAndUpdate(req.params.id, {
            paid: false,
            bookingPaid: null,
            payOnGate: false,
            totalPaid: 0
        });
        await Event.findByIdAndUpdate(booking.event, {
            $pull: {
                attendees: { booking: booking._id }
            }
        })
        res.redirect(`/admin/events/${booking.event._id}/manage`);
    } else {
        req.flash('error', `You don't have permission to delete that booking!`);
        res.redirect('/');
    }
};

module.exports.manageBooking = async(req, res, next) => {
    const booking = await eventBooking.findById(req.params.id).populate('event').populate('eventTickets').populate('user').populate('originalUser').populate({ path: 'event', populate: { path: 'eventHost' } }).populate({ path: 'event', populate: { path: 'eventTickets' } });
    const eventTickets = await booking.event.eventTickets.filter(a => new Date(a.availableFrom).toLocaleDateString() <= new Date().toLocaleDateString() && new Date(a.availableTo).toLocaleDateString() >= new Date().toLocaleDateString() && a.available && ['mealticket', 'mealticketchild', 'playerbunk', 'monsterbunk', 'staffbunk'].includes(a.ticketType) && !booking.eventTickets.find(t => t._id.equals(a._id)));
    const waitingList = req.query.waitinglist ? req.query.waitinglist : false;
    if (!booking) {
        req.flash('error', 'Could not find the selected booking!');
        return res.redirect('/');
    }
    if ((['eventHost'].includes(req.user.role) && req.user.eventHosts.filter(a => a._id.equals(booking.event.eventHost._id)).length > 0) || ['eventHost', 'admin', 'superAdmin'].includes(req.user.role)) {
        res.render('admin/events/bookingManage', { title: 'Manage Booking', eventBooking: booking, eventTickets, waitingList });
    } else {
        req.flash('error', `You don't have permission to view this booking`);
        res.redirect('/')
    }
};

module.exports.updateEventBooking = async(req, res, next) => {
    const booking = await eventBooking.findById(req.params.id).populate('event').populate('eventTickets').populate('user').populate('originalUser').populate({ path: 'event', populate: { path: 'eventHost' } });
    if (!booking) {
        req.flash('error', 'Could not find the selected booking!');
        return res.redirect('/');
    }
    if ((['eventHost'].includes(req.user.role) && req.user.eventHosts.filter(a => a._id.equals(booking.event.eventHost._id)).length > 0) || ['eventHost', 'admin', 'superAdmin'].includes(req.user.role)) {
        const ticket = await EventTicket.findById(req.body.eventTicket);
        await eventBooking.findByIdAndUpdate(req.params.id, { $push: { eventTickets: req.body.eventTicket }, totalDue: booking.totalDue + ticket.cost, paid: booking + ticket.cost == booking.totalPaid })
        req.flash('success', 'Event Booking Updated');
        res.redirect(`/admin/bookings/${req.params.id}`)
    } else
        req.flash('error', 'You can not edit the selected booking');
    res.redirect('/')
}

module.exports.dietaryEvent = async(req, res, next) => {
    const event = await Event.findById(req.params.id).populate('eventHost').populate({ path: 'attendees', populate: { path: 'user' } });
    if (req.user.eventHosts.filter(a => a._id.equals(event.eventHost._id)).length > 0 || ['admin', 'superAdmin'].includes(req.user.role)) {
        res.render('print/eventDietary', { title: `Manage ${event.name}`, event }, async function(err, str) {
            if (err) throw new ExpressError(err, 500)
            await pdfService.sendConfidentialPDF(res, str, `${event.name} Dietary.pdf`);
        })
    } else {
        req.flash('error', `You do not have permission to manage ${event.name}`)
        return res.redirect('/');
    }
};