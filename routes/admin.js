var express = require('express');
var router = express.Router({ mergeParams: true });
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAdmin, isSuperAdmin, isEventHost, isMatchingEventHost, usernameToLowerCase } = require('../middleware');
const multer = require('multer');
const { storage } = require('../utils/cloudinary');
const upload = multer({ storage });

const adminController = require('../controllers/admin');
const adminAboutController = require('../controllers/adminAbout');
const adminEventsController = require('../controllers/adminEvents');
const eventsController = require('../controllers/events');
const authController = require('../controllers/auth');
const EventBooking = require('../models/eventBooking')

router.route('/users')
    .get(isLoggedIn, isAdmin, catchAsync(adminController.listUsers));

router.route('/users/:id')
    .get(isLoggedIn, isAdmin, catchAsync(adminController.editUser))
    .post(isLoggedIn, isAdmin, catchAsync(adminController.updateUser))
    .delete(isLoggedIn, isAdmin, catchAsync(adminController.delUser))

router.route('/users/:id/add/:host')
    .get(isLoggedIn, isAdmin, catchAsync(adminController.addHostToUser));

router.route('/users/:id/del/:host')
    .get(isLoggedIn, isAdmin, catchAsync(adminController.delHostFromUser));

router.route('/users/:id/reset')
    .post(isLoggedIn, isAdmin, catchAsync(adminController.resetUserPassword));

router.route('/hosts')
    .get(isLoggedIn, isEventHost, catchAsync(adminController.eventHosts))

router.route('/hosts/new')
    .get(isLoggedIn, isAdmin, catchAsync(adminController.eventHostNewForm))
    .post(isLoggedIn, isAdmin, catchAsync(adminController.createEventHost))

router.route('/hosts/:id')
    .get(isLoggedIn, isMatchingEventHost, catchAsync(adminController.eventHostEdit))
    .post(isLoggedIn, isMatchingEventHost, upload.single('image'), catchAsync(adminController.eventHostUpdate))
    .delete(isLoggedIn, isAdmin, catchAsync(adminAboutController.deleteEventHost))

router.route('/hosts/:id/image')
    .delete(isLoggedIn, isAdmin, catchAsync(adminAboutController.deleteEventHostImg))

router.route('/systems')
    .get(isLoggedIn, isAdmin, catchAsync(adminController.eventSystemList));

router.route('/systems/new')
    .get(isLoggedIn, isAdmin, catchAsync(adminController.eventSystemNewForm))
    .post(isLoggedIn, isAdmin, upload.single('image'), catchAsync(adminController.eventSystemNew))

router.route('/systems/:id')
    .get(isLoggedIn, isAdmin, catchAsync(adminController.eventSystemEdit))
    .post(isLoggedIn, isAdmin, upload.single('image'), catchAsync(adminController.eventSystemUpdate))
    .delete(isLoggedIn, isSuperAdmin, catchAsync(adminController.eventSystemDelete))

router.route('/systems/:id/image')
    .delete(isLoggedIn, isAdmin, catchAsync(adminController.eventSystemDelImg))

router.route('/events')
    .get(isLoggedIn, isEventHost, catchAsync(adminEventsController.listHostedEvents));

router.route('/events/all')
    .get(isLoggedIn, isAdmin, catchAsync(adminEventsController.listEvents))

router.route('/events/new')
    .get(isLoggedIn, catchAsync(adminEventsController.createEventForm))
    .post(isLoggedIn, isEventHost, upload.single('image'), catchAsync(adminEventsController.createEvent))

router.route('/events/:id/manage')
    .get(isLoggedIn, isEventHost, catchAsync(adminEventsController.manageEvent))

router.route('/events/:id/waitinglist')
    .get(isLoggedIn, isEventHost, catchAsync(adminEventsController.eventWaitingList))

router.route('/events/:id/edit')
    .get(isLoggedIn, isEventHost, catchAsync(adminEventsController.editEvent))
    .delete(isLoggedIn, isEventHost, catchAsync(adminEventsController.deleteEvent))
    .put(isLoggedIn, isEventHost, upload.single('image'), catchAsync(adminEventsController.updateEvent))

router.route('/events/:id/cancel')
    .post(isLoggedIn, isEventHost, catchAsync(adminEventsController.cancelEvent))

router.route('/events/:id/print/signin')
    .get(isLoggedIn, isEventHost, catchAsync(adminEventsController.signinEvent))

router.route('/events/:id/print/medical')
    .get(isLoggedIn, isEventHost, catchAsync(adminEventsController.medicalEvent))

router.route('/events/:id/print/attendees')
    .get(isLoggedIn, isEventHost, catchAsync(adminEventsController.attendeesEvent))

router.route('/events/:id/print/dietary')
    .get(isLoggedIn, isEventHost, catchAsync(adminEventsController.dietaryEvent))

router.route('/events/:id/print/pid')
    .get(isLoggedIn, isEventHost, catchAsync(adminEventsController.pidEvent))

router.route('/events/:id/tickets/new')
    .get(isLoggedIn, isEventHost, catchAsync(adminEventsController.createEventTicket))
    .post(isLoggedIn, isEventHost, catchAsync(adminEventsController.createEventTicketPost))

router.route('/events/:id/tickets/:ticketId')
    .get(isLoggedIn, isEventHost, catchAsync(adminEventsController.editEventTicket))
    .post(isLoggedIn, isEventHost, catchAsync(adminEventsController.updateEventTicket))
    .delete(isLoggedIn, isEventHost, catchAsync(adminEventsController.deleteEventTicket))

router.route('/bookings/:id')
    .get(isLoggedIn, isEventHost, catchAsync(adminEventsController.manageBooking))
    .post(isLoggedIn, isEventHost, catchAsync(adminEventsController.bookingCash))
    .put(isLoggedIn, isEventHost, catchAsync(adminEventsController.updateEventBooking))
    .delete(isLoggedIn, isEventHost, catchAsync(adminEventsController.deleteBooking))

router.route('/bookings/:id/cancel')
    .post(isLoggedIn, isEventHost, catchAsync(adminEventsController.cancelBookingPayment))

router.route('/bookings/:id/queue')
    .post(isLoggedIn, isEventHost, catchAsync(adminEventsController.addToQueue))
    .delete(isLoggedIn, isEventHost, catchAsync(adminEventsController.delFromQueue))

// Site About Information

router.route('/faq')
    .get(isLoggedIn, isSuperAdmin, catchAsync(adminAboutController.listFaq));

router.route('/faq/new')
    .get(isLoggedIn, isSuperAdmin, catchAsync(adminAboutController.createFaq))
    .post(isLoggedIn, isSuperAdmin, catchAsync(adminAboutController.createFaqPost))

router.route('/faq/:id')
    .get(isLoggedIn, isSuperAdmin, catchAsync(adminAboutController.editFaq))
    .delete(isLoggedIn, isSuperAdmin, catchAsync(adminAboutController.deleteFaq))

router.route('/policies')
    .get(isLoggedIn, isSuperAdmin, catchAsync(adminAboutController.policies))
    .post(isLoggedIn, isSuperAdmin, catchAsync(adminAboutController.policiesUpdate));

router.route('/config')
    .get(isLoggedIn, isSuperAdmin, catchAsync(adminAboutController.editConfig))
    .post(isLoggedIn, isSuperAdmin, upload.single('image'), catchAsync(adminAboutController.postConfig))
    .delete(isLoggedIn, isSuperAdmin, catchAsync(adminAboutController.delConfig))

module.exports = router;