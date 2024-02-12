const siteConfig = require('../models/siteConfig')
const Event = require('../models/lrpEvent');
const EventSystems = require('../models/eventSystems')
const FAQ = require('../models/faq')
const User = require('../models/user')
const axios = require('axios');
const emailService = require('../utils/email');
const imageService = require('../utils/image')
const express = require('express');

module.exports.privacy = async(req, res, next) => {
    const config = await siteConfig.find();
    res.render('about/privacy', { title: 'Privacy Policy', config: config[0] });
};

module.exports.terms = async(req, res, next) => {
    const config = await siteConfig.find();
    res.render('about/terms', { title: 'Terms & Conditions', config: config[0] });
};

module.exports.faq = async(req, res, next) => {
    const faq = await FAQ.find();
    res.render('about/faq', { title: `Frequently Asked Questions`, faq });
}

module.exports.organisers = async(req,res,next) => {
    const meta = {
        crawl: true
    }
    res.render('about/organisers',{title:'Event Organisers', meta});
}

module.exports.about = async(req,res,next) => {
    const meta = {
        crawl: true
    }

    res.render('about/about',{title:`About ${res.locals.config.siteName}`, express: require('express/package').version, meta});
}

module.exports.eventSystem = async (req,res,next) => {
    const eventSystem = await EventSystems.findOne({systemRef: req.params.id});    
    if (eventSystem){
        const eventList = await Event.find({ visible: true, cancelled: false, eventEnd: { $gte: new Date() }}).populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } }).sort({ eventStart: 'asc' });
        const meta = {
            title: `LARP Event Bookings: Upcoming Events for ${eventSystem.name}`,
            description: 'LARP Event Bookings - Event information and booking for LRP events across the United Kingdom',
            path: '/'
        }
            return res.render('about/eventSystem', {title: eventSystem.name, eventSystem, meta, events: eventList.filter(e => e.eventHost.eventSystem.equals(eventSystem._id))})
    }
    else
    {
        req.flash('error',`Unable to find your requested LARP System`);
        return res.redirect('/');
    }
}

module.exports.eventSystemTerms = async(req,res,next) => {
    const meta = {
        crawl: true
    }
    const eventSystem = await EventSystems.findOne({systemRef: req.params.id});
    if (eventSystem)
        return res.render('about/eventSystemTerms', {title: eventSystem.name, eventSystem, meta})
    else
    {
        req.flash('error',`Unable to find your requested LARP System`);
        return res.redirect('/');
    }
}

module.exports.configCheck = async (req, res, next) => {
    const config = await siteConfig.findOne();
    if (typeof config == 'undefined' || !config) {
        return res.sendStatus(418);
    }
    res.locals.config = config;
    return res.sendStatus(200);
}

module.exports.renderInitialConfig = async(req,res,next) => {
    const config = await siteConfig.findOne();
    if (typeof config == 'undefined' || !config) {
        return res.render('admin/about/firstConfig')
    }
    else{
        req.flash('error','You do not have permission to access this resource!')
        return res.redirect('/');
    }
}

module.exports.initialConfig = async(req,res,next) => {
    const config = await siteConfig.findOne();
    if (typeof config == 'undefined' || !config) {
        try {
            await new siteConfig({...req.body.config}).save();
            res.locals.config = await siteConfig.findOne();
            const { username, password } = req.body.user;
            const newUser = new User({ username, role:'superAdmin' });
            const registeredUser = await User.register(newUser, password);
            req.login(registeredUser, err => {
                if (err) return next();
                req.flash('success', `Welcome to ${res.locals.config.siteName} ${registeredUser.username}!`);
                const redirectUrl = req.session.returnTo || '/';
                delete req.session.returnTo;
                return res.redirect('/account');
            });
        } catch (e) {
            console.log(e);
            req.flash('error', e.message);
            return res.redirect('register');
        }
    }
    else
    {
        req.flash('error','You do not have permission to access this resource!')
        return res.redirect('/');
    }
}

module.exports.registerSystemForm = async (req, res, next) => {
    return res.render('about/registerEventSystem',{title:'Register Your Event System'});
}

module.exports.registerSystem = async (req, res, next) => {
    const response = await axios.post(`https://recaptchaenterprise.googleapis.com/v1/projects/lrp-event-booking/assessments?key=${process.env.GOOGLE_API_KEY}`, {
        event: {
            token: req.body.token,
            siteKey: process.env.RECAPTCHA_KEY
        }
    }).then(async (response) => {
        if (response.data.tokenProperties.valid && response.data.riskAnalysis.score < 1) {
            res.render('email/newRegistrant', { title: `A new Event System wants to register!`, registrant: req.body }, async function (err, str) {
                if (err) throw new ExpressError(err, 500)
                await emailService.sendEmail(res.locals.config.techContactEmail, `${req.body.systemName} wants to register!`, str)
                req.flash('success', 'Thank you for your request! We will get back to you as soon as possible')
                return res.redirect('/organisers')
            })
        }
    })
}

module.exports.renderOGCard = async(req,res,next) => {
    if (req.query.preview && !req.query.event)
        res.render('ogCard', {title:'ogCard'})
    else if (req.query.event){
        const event = await Event.findById(req.query.event).populate('eventHost').populate({path:'eventHost', populate: 'eventSystem'});
        if (req.query.preview)
            res.render('ogCardEvent', {title:'ogCard', event})
        else
            res.render('ogCardEvent', { title: `ogCard`, event}, async function (err, str) {
                if (err) throw new ExpressError(err, 500)
                await imageService.sendPNG(res,str,'blank.png')
            })
    }
    else{
        res.render('ogCard', { title: `ogCard`}, async function (err, str) {
            if (err) throw new ExpressError(err, 500)
            await imageService.sendPNG(res,str,'blank.png')
        })
    }
    
}