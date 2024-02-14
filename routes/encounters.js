var express = require('express');
var router = express.Router({ mergeParams: true });
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAdmin } = require('../middleware');

const controller = require('../controllers/adminEncounters')
const printController = require('../controllers/adminPrint')

/* GET home page. */
router.route('/')
    .get(isLoggedIn, catchAsync(controller.index))
    .post(isLoggedIn, catchAsync(controller.create))

router.route('/new')
    .get(isLoggedIn, catchAsync(controller.new));

router.route('/print')
    .get(isLoggedIn, catchAsync(printController.encounters))

router.route('/:encounterId')
    .get(isLoggedIn, catchAsync(controller.editForm))
    .put(isLoggedIn,catchAsync(controller.update))

router.route('/:encounterId/comment')
    .post(isLoggedIn, catchAsync(controller.addComment))
    .delete(isLoggedIn, catchAsync(controller.deleteComment))

router.route('/:encounterId/monster')
    .post(isLoggedIn,catchAsync(controller.addMonster))
router.route('/:encounterId/monster/:monsterId')
    .delete(isAdmin,catchAsync(controller.deleteMonster))

module.exports = router;