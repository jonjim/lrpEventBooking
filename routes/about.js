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

router.route('/system/:id')
    .get(catchAsync(controller.eventSystem))

router.route('/system/:id/terms')
    .get(catchAsync(controller.eventSystemTerms))

router.route('/checkConfig')
    .get(catchAsync(controller.configCheck))


router.route('/initialConfig')
    .get(catchAsync(controller.renderInitialConfig))
    .post(catchAsync(controller.initialConfig))

router.route('/:id')
    .get(catchAsync(async (req,res,next) => { 
        res.redirect(`/system/${req.params.id}`);
    }))

router.route('/:id/terms')
    .get(catchAsync(async (req,res,next) => { 
        res.redirect(`/system/${req.params.id}/terms`);
    }))

module.exports = router;