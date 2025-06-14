const User = require('../models/user');
const axios = require('axios');
const EventBooking = require('../models/eventBooking');
const eventSystems = require('../models/eventSystems')
const crypto = require('crypto');
const emailService = require('../utils/email');

module.exports.renderRegister = async (req, res, next) => {
    if (req.isAuthenticated()) {
        res.redirect('/account')
    }
    const systems = await eventSystems.find({active:true})
    res.render('user/register', { title: 'Create New Account', systems });
};

module.exports.register = async (req, res, next) => {
    const { username, password, token } = req.body;
    const userLookup = await User.find({ username: username });
    if (userLookup.length > 0) {
        req.flash('error', 'That e-mail address is already registered!')
        return res.redirect('/register')
    }
    const response = await axios.post(`https://recaptchaenterprise.googleapis.com/v1/projects/lrp-event-booking/assessments?key=${process.env.GOOGLE_API_KEY}`, {
            event: {
                token: token,
                siteKey: process.env.RECAPTCHA_KEY
            }
    }).then(async (response) => {
        if (response.data.tokenProperties.valid && response.data.riskAnalysis.score < 1) {
            const newUser = new User({ username });
            try {
                const registeredUser = await User.register(newUser, password);
                req.login(registeredUser, err => {
                    if (err) return next();
                    res.render('email/registration', {title: 'Take the next step and book your first event with us now!'} ,async function(err, str) {
                        emailService.sendEmail(req.user.username, `Welcome to ${res.locals.config.siteName}`, str);
                        req.flash('success', `Welcome to ${res.locals.config.siteName} ${registeredUser.username}!`);
                        const redirectUrl = req.session.returnTo || '/';
                        delete req.session.returnTo;
                        return res.redirect(redirectUrl);
                    })
                });
            } catch (e) {
                req.flash('error', e.message);
                return res.redirect('/register');
            }
        }
        else {
            req.flash('error', 'There was an error validating your details.')
            return res.redirect('/register')
        }
    })
};

module.exports.listEventBookingsUser = async(req, res, next) => {
    const eventBookings = await EventBooking.find({ user: req.user._id }).populate('eventTickets').populate('event').populate({ path: 'event', populate: { path: 'eventHost' } }).populate({ path: 'event', populate: { path: 'eventHost', populate: { path: 'eventSystem'} } }).sort({ bookingMade: 'desc' });
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
            if (eventBooking.event.playerSpaces === 0 && eventBooking.payOnGate == false && eventBooking.inQueue == false) return res.render('events/full', { title: 'No spaces available', eventBooking })
            break;
        case 'monster':
            if (eventBooking.event.monsterSpaces === 0 && eventBooking.payOnGate == false && eventBooking.inQueue == false) return res.render('events/full', { title: 'No spaces available', eventBooking })
            break;
        case 'staff':
            if (eventBooking.event.staffSpaces === 0 && eventBooking.payOnGate == false && eventBooking.inQueue == false) return res.render('events/full', { title: 'No spaces available', eventBooking })
            break;
    }
    console.log()
    if (eventBooking.paid && eventBooking.totalDue == eventBooking.totalPaid) {
        req.flash('error', `Your event booking for ${ eventBooking.event.name } has already been fully paid`);
        return res.redirect('/account/bookings');
    } else
        return res.render('events/pay', { title: `Pay for ${eventBooking.event.name}`, eventBooking, payeeAddress: eventBooking.event.eventHost.paypalAddress });
}

function Object_assign (target, ...sources) {
    sources.forEach(source => {
      Object.keys(source).forEach(key => {
        const s_val = source[key]
        const t_val = target[key]
        target[key] = t_val && s_val && typeof t_val === 'object' && typeof s_val === 'object'
                    ? Object_assign(t_val, s_val)
                    : s_val
      })
    })
    return target
  }

module.exports.accountUpdate = async (req, res, next) => {
    req.body.displayBookings = typeof req.body.displayBookings != 'undefined' ? req.body.displayBookings == 'on' ? true : false : false;
    const systems = await eventSystems.find({ active: true });
    for (system of systems) {
        req.body[system.systemRef].marketing = typeof req.body[system.systemRef].marketing != 'undefined' ? req.body[system.systemRef].marketing == 'on' ? true : false : false;
        for (field of system.customFields) {
            if (field.type == 'checkbox') {
                if (field.section == 'character')
                    req.body[system.systemRef].character[field.name] = typeof req.body[system.systemRef].character[field.name] != 'undefined' ? req.body[system.systemRef].character[field.name] == 'on' ? true : false : false;
                if (field.section == 'player')
                req.body[system.systemRef][field.name] = typeof req.body[system.systemRef][field.name] != 'undefined' ? req.body[system.systemRef][field.name] == 'on' ? true : false : false;
            }
        }
    }
    const userCurrent = await User.findById(req.user._id);    
    const user = await User.findByIdAndUpdate(req.user._id, { ...Object_assign(JSON.parse(JSON.stringify(userCurrent)),req.body) }, { new: true, strict:false })
    req.user = user;
    const redirectUrl = req.session.returnTo || '/account';
    req.session.returnTo = undefined;
    res.redirect(redirectUrl);
};

module.exports.renderLoginForm = (req, res) => {
    if (req.isAuthenticated && req.user) {
        return res.redirect('/account')
    }
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

module.exports.accountDelete = async (req, res, next) => {
    if (req.isAuthenticated()) {
        const userId = req.user._id;
        req.logout(async function(err) {
            if (err) { return next(err); }
            await User.findByIdAndDelete(userId);
            req.flash('success', `We're sorry to see you go! Your account has now been closed.`);
            return res.redirect('/');
        });
    }
}

module.exports.login = async(req, res) => {
        const redirectUrl = req.session.returnTo || '/';
        delete req.session.returnTo;
        if (req.user) {
            req.flash('success', 'Welcome back!');
            res.redirect(redirectUrl);
        } else {
            req.flash('success', `Welcome to ${res.locals.config.siteName}!`);
            res.redirect('/account');
        }
};

module.exports.renderEditForm = async(req, res, next) => {
    console.log('editform');
    const user = await User.findById(req.params.id);
    res.render('user/edit', { title: 'Edit User', user })
};

module.exports.renderAccountSettings = async (req, res, next) => {
    const user = await User.findById(req.user._id, { strict: false });
    const systems = await eventSystems.find();
    const selectedSystem = req.query.system;
    res.render('user/accountSettings', { title: 'My Account', eventSystems: systems, user: JSON.parse(JSON.stringify(user)), selectedSystem });
};

module.exports.ltAPI = async(req, res, next) => {
    const response = await axios.get(`https://lorientrust.com/wp-json/LTHelpers/LTCharacterAccess/1.0.2/character/${req.params.id}`, {
        headers: { Authorization: `Basic ${process.env.LTAPI_KEY}` }
    })
    try {
        await User.findByIdAndUpdate(req.user._id, {
            lorienTrust: {
                authCode: req.params.id,
                character: response.data,
                playerId: response.data.pid.toString(),
            }
        }, {strict: false});
    } catch (error) {
        console.log(error);
    }
    return res.json(response.data);
};

module.exports.resetPasswordLink = async(req, res, next) => {
    const user = await User.find({ username: req.body.username });
    if (user.length === 0) {
        req.flash('error', 'E-mail Address was not found');
        return res.redirect('/resetpassword');
    }
    user[0].resetPassword = crypto.randomBytes(8).toString('hex');
    user[0].save();

    res.render('email/lostPassword', { user: user[0], title: 'Password reset instructions' }, async function(err, str) {
        emailService.sendEmail(user[0].username, `Password Reset`, str);
        req.flash('success', 'Please check your e-mails for instructions to reset your password');
        return res.redirect(`/login`);
    })
}

module.exports.resetPasswordForm = async (req, res, next) => {
    const user = await User.findOne({ resetPassword: req.params.id });
    if (!user) {
        req.flash('error', 'This password reset link is not valid');
        return res.redirect('/');
    }
    return res.render('user/resetPassword', { title: "Password Reset", user });
}

module.exports.resetPassword = async(req, res, next) => {
    const user = await User.findOne({ resetPassword: req.params.id });
    if (!user) {
        req.flash('error', 'This password reset link is not valid');
        return res.redirect('/resetpassword');
    }
    
    await user.setPassword(req.body.password, (err,res) => {
        if (err) {
            req.flash('error','There was a problem resetting your password')
            console.log(err)
        }
        req.flash('success', 'Your password has been reset.')
        res.resetPassword = undefined;
        res.save();
    });
    return res.redirect('/login');
}

module.exports.changePasswordForm = async(req, res, next) => {
    return res.render('user/changePassword', { title: "Password Reset" });
};

module.exports.changePassword = async(req, res, next) => {
    const user = await User.findById(req.user._id);
    req.flash('success', 'Your password has been changed')
    await user.setPassword(req.body.password, (err,res) => {
        if (err) {
            req.flash('error','There was a problem changing your password')
            console.log(err)
        }
        res.resetPassword = undefined;
        res.save();
    });
    return res.redirect('/');
}