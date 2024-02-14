var express = require('express');
var router = express.Router();
const { isLoggedIn } = require('../middleware');
const catchAsync = require('../utils/catchAsync');
const Monster = require('../models/monster');

const controller = require('../controllers/adminMonsters')

router.route('/')
    .get(isLoggedIn, catchAsync(controller.index))
    .post(isLoggedIn, catchAsync(controller.create))

router.route('/new')
    .get(isLoggedIn, catchAsync(controller.new));

router.route('/:id')
    .get(isLoggedIn, catchAsync(controller.edit))


module.exports = router;