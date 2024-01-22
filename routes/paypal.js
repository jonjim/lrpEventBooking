var express = require('express');
var router = express.Router({ mergeParams: true });
const catchAsync = require('../utils/catchAsync');

const controllerPaypal = require('../controllers/paypal');
const adminPaypal = require('../controllers/adminPaypal');
const { isLoggedIn, isEventHost } = require('../middleware');

router.route('/create')
    .post(catchAsync(controllerPaypal.createOrder))

router.route('/capture/:orderID')
    .post(catchAsync(controllerPaypal.capturePayment))

router.route('/cancelled')
    .get(catchAsync(controllerPaypal.cancelled))

router.route('/registration/create')
    .post(catchAsync(adminPaypal.createOrder))

router.route('/registration/capture/:orderID')
    .post(catchAsync(adminPaypal.capturePayment))

router.route('/registration/cancelled')
    .get(catchAsync(adminPaypal.cancelled))

module.exports = router;