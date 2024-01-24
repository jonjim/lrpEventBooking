var express = require('express');
var router = express.Router({ mergeParams: true });
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn } = require('../middleware');

const controller = require('../controllers/events');

router.route('/')
    .get(catchAsync(controller.upcomingEvents));

router.route('/events.ics')
    .get(catchAsync(controller.icsEvents))

router.route('/rss')
    .get(catchAsync(controller.rssEvents))

router.route('/events/booking/gift')
    .post(isLoggedIn, catchAsync(controller.giftBooking));

router.route('/events/booking/:id')
    .get(isLoggedIn, catchAsync(controller.editEventBooking))
    .post(isLoggedIn, catchAsync(controller.updateEventBooking))
    .delete(isLoggedIn, catchAsync(controller.cancelEventBooking));

router.route('/events/booking/:id/ticket')
    .get(isLoggedIn, catchAsync(controller.eventBookingTicket))

router.route('/events/:id')
    .get(catchAsync(controller.showEvent))

router.route('/events/:id/book')
    .get(isLoggedIn, catchAsync(controller.showEventBooking))
    .post(isLoggedIn, catchAsync(controller.createEventBooking))

module.exports = router;