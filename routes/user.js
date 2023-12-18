var express = require('express');
var router = express.Router({ mergeParams: true });
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');
const { isLoggedIn, usernameToLowerCase } = require('../middleware');

const auth = require('../controllers/user');

/* GET users listing. */
router.route('/login')
    .get(auth.renderLoginForm)
    .post(usernameToLowerCase, passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), catchAsync(auth.login));

router.route('/register')
    .get(auth.renderRegister)
    .post(usernameToLowerCase,catchAsync(auth.register));

router.route('/logout')
    .get(isLoggedIn, catchAsync(auth.logout))

router.route('/password')
    .get(isLoggedIn, catchAsync(auth.changePasswordForm))
    .post(isLoggedIn, catchAsync(auth.changePassword))

router.route('/resetpassword')
    .get(function(req,res,next) { res.render('user/resetSearch',{title:"Password Reset"})})
    .post(catchAsync(auth.resetPasswordLink))

router.route('/resetpassword/:id')
    .get(catchAsync(auth.resetPasswordForm))
    .post(catchAsync(auth.resetPassword))

router.route('/account')
    .get(isLoggedIn, catchAsync(auth.renderAccountSettings))
    .post(isLoggedIn, catchAsync(auth.accountUpdate))

router.route('/account/bookings')
    .get(isLoggedIn, catchAsync(auth.listEventBookingsUser))

router.route('/account/pay/:id')
    .get(catchAsync(auth.payEventBooking))

router.route('/account/character/:id')
    .get(isLoggedIn, catchAsync(auth.ltAPI))

router.route('/account/update')
    .get(isLoggedIn, catchAsync(auth.renderAccountUpdate))

router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback',
    passport.authenticate('google', { failureFlash: true, failureRedirect: '/login' }), catchAsync(auth.login));

router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureFlash: true, failureRedirect: '/login' }), catchAsync(auth.login));

module.exports = router;