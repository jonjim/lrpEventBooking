var express = require('express');
var router = express.Router({ mergeParams: true });
const catchAsync = require('../utils/catchAsync');

const controller = require('../controllers/about');

router.route('/privacy')
    .get(catchAsync(controller.privacy))

router.route('/terms')
    .get(catchAsync(controller.terms))

router.route('/faq')
    .get(catchAsync(controller.faq))

router.route('/organisers')
    .get(catchAsync(controller.organisers))

module.exports = router;