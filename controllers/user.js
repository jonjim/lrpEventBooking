const User = require('../models/user');
const axios = require('axios');
const fs = require('fs');
const EventBooking = require('../models/eventBooking');
const Event = require('../models/event');
const EventTicket = require('../models/eventTicket');
const event = require('../models/event');
const eventSystems = require('../models/eventSystems')
const crypto = require('crypto');
const emailService = require('../utils/email');


module.exports.renderRegister = (req, res) => {
    res.render('user/register', { title: 'Create New Account' });
};

module.exports.register = async(req, res, next) => {
    const { username, password } = req.body;
    const newUser = new User({ username });
    try {
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, err => {
            if (err) return next();
            req.flash('success', `Welcome to Lorien Trust Sanctioned Events ${registeredUser.username}!`);
            const redirectUrl = req.session.returnTo || '/';
            delete req.session.returnTo;
            return res.redirect(redirectUrl);
        });
    } catch (e) {
        req.flash('error', e.message);
        return res.redirect('register');
    }
};

module.exports.listEventBookingsUser = async(req, res, next) => {
    const eventBookings = await EventBooking.find({ user: req.user._id }).populate('eventTickets').populate('event').populate({ path: 'event', populate: { path: 'eventHost' } }).sort({ bookingMade: 'desc' });
    if (eventBookings.length > 0)
        return res.render('user/eventList', { title: `Your Event Bookings`, eventBookings: eventBookings, event: eventBookings[0].event });
    else {
        req.flash('error', 'You do not have any event bookings yet!');
        return res.redirect('/');
    }
}

module.exports.payEventBooking = async(req, res, next) => {
    const eventBooking = await EventBooking.findById(req.params.id).populate('event').populate({ path: 'event', populate: { path: 'eventHost' } }).populate('eventTickets').populate('user');
    switch (eventBooking.bookingType) {
        case 'player':
            if (eventBooking.event.playerSpaces === 0 && (!eventBooking.payOnGate || eventBooking.inQueue)) return res.render('events/full', { title: 'No spaces available', eventBooking })
            break;
        case 'monster':
            if (eventBooking.event.monsterSpaces === 0 && (!eventBooking.payOnGate || eventBooking.inQueue)) return res.render('events/full', { title: 'No spaces available', eventBooking })
            break;
        case 'staff':
            if (eventBooking.event.staffSpaces === 0 && (!eventBooking.payOnGate || eventBooking.inQueue)) return res.render('events/full', { title: 'No spaces available', eventBooking })
            break;
    }

    if (eventBooking.paid && eventBooking.totalDue == eventBooking.totalPaid) {
        req.flash('error', `Your event booking for ${ eventBooking.event.name } has already been fully paid`);
        return res.redirect('/account/bookings');
    } else
        return res.render('events/pay', { title: `Pay for ${eventBooking.event.name}`, eventBooking });
}

module.exports.accountUpdate = async (req, res, next) => {
    req.body.displayBookings = typeof req.body.displayBookings != 'undefined' ? req.body.displayBookings == 'on' ? true : false : false;
    // Lorien Trust specific settings
    req.body.lorienTrust.firstAid = typeof req.body.lorienTrust.firstAid != 'undefined' ? req.body.lorienTrust.firstAid == 'on' ? true : false : false;
    req.body.lorienTrust.mentalFirstAid = typeof req.body.lorienTrust.mentalFirstAid != 'undefined' ? req.body.lorienTrust.mentalFirstAid == 'on' ? true : false : false;
    req.body.lorienTrust.bowComp = typeof req.body.lorienTrust.bowComp != 'undefined' ? req.body.lorienTrust.bowComp == 'on' ? true : false : false;
    req.body.lorienTrust.clawComp = typeof req.body.lorienTrust.clawComp != 'undefined' ? req.body.lorienTrust.clawComp == 'on' ? true : false : false;
    req.body.lorienTrust.wepCheck = typeof req.body.lorienTrust.wepCheck != 'undefined' ? req.body.lorienTrust.wepCheck == 'on' ? true : false : false;
    // End

    const user = await User.findByIdAndUpdate(req.user._id, {...req.body }, { new: true })
    req.user = user;
    res.redirect('/account');
};

module.exports.renderLoginForm = (req, res) => {
    res.render('user/login', { title: 'Login to your account' });
};

module.exports.logout = async(req, res, next) => {
    if (req.isAuthenticated()) {
        req.logout(function(err) {
            if (err) { return next(err); }
            req.flash('success', 'Goodbye!');
            return res.redirect('/');
        });
    }
    return res.redirect('/')
};

module.exports.login = async(req, res) => {
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    if (req.user.playerId && req.user.username) {
        req.flash('success', 'Welcome back!');
        res.redirect(redirectUrl);
    } else {
        req.flash('success', 'Welcome to Lorien Trust Sanctioned Events!');
        res.redirect('/account');
    }
};

module.exports.renderEditForm = async(req, res, next) => {
    console.log('editform');
    const user = await User.findById(req.params.id);
    res.render('user/edit', { title: 'Edit User', user })
};

module.exports.renderAccountSettings = async(req, res, next) => {
    const systems = await eventSystems.find();
    let settingsList = await fs.readdirSync('./views/user/systemSettings')
    res.render('user/accountSettings', { title: 'My Account', eventSystems: systems, settingsList });
};

module.exports.ltAPI = async(req, res, next) => {
    const response = await axios.get(`https://lorientrust.com/wp-json/LTHelpers/LTCharacterAccess/1.0.2/character/${req.params.id}`, {
        headers: { Authorization: `Basic ${process.env.LTAPI_KEY}` }
    })
    try {
        await User.findByIdAndUpdate(req.user._id, {
            lorienTrust: {
                authCode: req.params.id,
                character: { ...response.data },
                playerId: response.data.pid,
            }
        });
    } catch (error) {
        console.log(error);
    }
    return res.json(response.data);
};

module.exports.resetPasswordLink = async(req, res, next) => {
    const user = await User.find({ username: req.body.username });
    if (user.length === 0) {
        req.flash('error', 'E-mail Address was not found');
        return res.redirect('/');
    }
    user[0].resetPassword = crypto.randomBytes(8).toString('hex');
    user[0].save();

    res.render('email/lostPassword', { user: user[0] }, async function(err, str) {
        emailService.sendEmail(user[0].username, `Password Reset`, str);
        req.flash('success', 'Please check your e-mails for instructions to reset your password');
        return res.redirect(`/`);
    })
}

module.exports.resetPasswordForm = async(req, res, next) => {
    const user = await User.findOne({ resetPassword: req.params.id });
    if (!user) {
        req.flash('error', 'This password reset link is not valid');
        return res.redirect('/');
    }
    return res.render('user/resetPassword.ejs', { title: "Password Reset", user });
}

module.exports.resetPassword = async(req, res, next) => {
    const user = await User.findOne({ resetPassword: req.params.id });
    if (!user) {
        req.flash('error', 'This password reset link is not valid');
        return res.redirect('/');
    }
    req.flash('success', 'Your password has been reset')
    user.setPassword(req.body.password);
    user.resetPassword = undefined;
    user.save();
    return res.redirect('/');
}

module.exports.changePasswordForm = async(req, res, next) => {
    return res.render('user/changePassword.ejs', { title: "Password Reset" });
};

module.exports.changePassword = async(req, res, next) => {
    const user = await User.findById(req.user._id);
    req.flash('success', 'Your password has been changed')
    user.setPassword(req.body.password);
    user.resetPassword = undefined;
    user.save();
    return res.redirect('/');
}