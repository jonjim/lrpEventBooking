var express = require('express');
var router = express.Router({ mergeParams: true });
const catchAsync = require('../utils/catchAsync');

const controllerPaypal = require('../controllers/paypal');
const { isLoggedIn } = require('../middleware');

router.route('/create')
    .post(catchAsync(controllerPaypal.createOrder))

router.route('/capture/:orderID')
    .post(catchAsync(controllerPaypal.capturePayment))

router.route('/cancelled')
    .get(catchAsync(controllerPaypal.cancelled))

module.exports = router;