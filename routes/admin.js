var express = require('express');
var router = express.Router({ mergeParams: true });
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAdmin, isSuperAdmin, isEventHost, isMatchingEventHost, isMatchingSystemAdmin, isSystemAdmin, usernameToLowerCase } = require('../middleware');
const multer = require('multer');
const { storage } = require('../utils/cloudinary');
const upload = multer({ storage });

const adminController = require('../controllers/admin');
const adminAboutController = require('../controllers/adminAbout');
const adminEventsController = require('../controllers/adminEvents');
const adminPrintController = require('../controllers/adminPrint')
const emailController = require('../controllers/email');

router.route('/users')
    .get(isLoggedIn, isAdmin, catchAsync(adminController.listUsers));

router.route('/users/:id')
    .get(isLoggedIn, isAdmin, catchAsync(adminController.editUser))
    .post(isLoggedIn, isAdmin, catchAsync(adminController.updateUser))
    .delete(isLoggedIn, isAdmin, catchAsync(adminController.delUser))

router.route('/users/:id/add/host/:host')
    .get(isLoggedIn, isAdmin, catchAsync(adminController.addHostToUser));

router.route('/users/:id/del/host/:host')
    .get(isLoggedIn, isAdmin, catchAsync(adminController.delHostFromUser));

router.route('/users/:id/add/system/:system')
    .get(isLoggedIn, isAdmin, catchAsync(adminController.addSystemToUser));

router.route('/users/:id/del/system/:system')
    .get(isLoggedIn, isAdmin, catchAsync(adminController.delSystemFromUser));

router.route('/users/:id/reset')
    .post(isLoggedIn, isAdmin, catchAsync(adminController.resetUserPassword));

router.route('/hosts')
    .get(isLoggedIn, isEventHost, catchAsync(adminController.eventHosts))

router.route('/hosts/new')
    .get(isLoggedIn, isSystemAdmin, catchAsync(adminController.eventHostNewForm))
    .post(isLoggedIn, isSystemAdmin, catchAsync(adminController.createEventHost))

router.route('/hosts/:id')
    .get(isLoggedIn, isMatchingEventHost, catchAsync(adminController.eventHostEdit))
    .post(isLoggedIn, isMatchingEventHost, upload.single('image'), catchAsync(adminController.eventHostUpdate))
    .delete(isLoggedIn, isAdmin, catchAsync(adminAboutController.deleteEventHost))

router.route('/hosts/:id/image')
    .delete(isLoggedIn, isMatchingEventHost, catchAsync(adminAboutController.deleteEventHostImg))

router.route('/systems')
    .get(isLoggedIn, isSystemAdmin, catchAsync(adminController.eventSystemList));

router.route('/systems/new')
    .get(isLoggedIn, isAdmin, catchAsync(adminController.eventSystemNewForm))
    .post(isLoggedIn, isAdmin, upload.single('image'), catchAsync(adminController.eventSystemNew))

router.route('/systems/:id')
    .get(isLoggedIn, isMatchingSystemAdmin, catchAsync(adminController.eventSystemEdit))
    .post(isLoggedIn, isMatchingSystemAdmin, upload.single('image'), catchAsync(adminController.eventSystemUpdate))
    .delete(isLoggedIn, isSuperAdmin, catchAsync(adminController.eventSystemDelete))

router.route('/systems/:id/fields')
    .post(isLoggedIn, isMatchingSystemAdmin, catchAsync(adminController.eventSystemAddField))
    .put(isLoggedIn, isMatchingSystemAdmin, catchAsync(adminController.eventSystemUpdateField))
    .delete(isLoggedIn, isMatchingSystemAdmin, catchAsync(adminController.eventSystemDeleteField))

router.route('/systems/:id/image')
    .delete(isLoggedIn, isMatchingSystemAdmin, catchAsync(adminController.eventSystemDelImg))

router.route('/events')
    .get(isLoggedIn, isEventHost, catchAsync(adminEventsController.listHostedEvents));

router.route('/events/all')
    .get(isLoggedIn, isSystemAdmin, catchAsync(adminEventsController.listEvents))

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

router.route('/events/:id/email')
    .post(isLoggedIn,isEventHost, catchAsync(adminEventsController.customEmail))

router.route('/events/:id/cancel')
    .post(isLoggedIn, isEventHost, catchAsync(adminEventsController.cancelEvent))

router.route('/events/:id/print/signin')
    .get(isLoggedIn, isEventHost, catchAsync(adminPrintController.signinEvent))

router.route('/events/:id/print/medical')
    .get(isLoggedIn, isEventHost, catchAsync(adminPrintController.medicalEvent))

router.route('/events/:id/print/attendees')
    .get(isLoggedIn, isEventHost, catchAsync(adminPrintController.attendeesEvent))

router.route('/events/:id/print/dietary')
    .get(isLoggedIn, isEventHost, catchAsync(adminPrintController.dietaryEvent))

router.route('/events/:id/print/pid')
    .get(isLoggedIn, isEventHost, catchAsync(adminPrintController.pidEvent))

router.route('/events/:id/print/eventPack')
    .get(isLoggedIn, isEventHost, catchAsync(adminPrintController.eventPack))
    .post(isLoggedIn, isEventHost, catchAsync(adminPrintController.eventPack))

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

router.route('/email')
    .get(isLoggedIn,isSuperAdmin,catchAsync(emailController.listEmails))
    .post(isLoggedIn,isSuperAdmin,catchAsync(emailController.sendEmail))

module.exports = router;