const siteConfig = require('../models/siteConfig')
const Event = require('../models/lrpEvent');
const EventSystems = require('../models/eventSystems')
const FAQ = require('../models/faq')
const User = require('../models/user')

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
    res.render('about/about',{title:`About ${res.locals.config.siteName}`, meta});
}

module.exports.eventSystem = async (req,res,next) => {
    const eventSystem = await EventSystems.findOne({systemRef: req.params.id});    
    const eventList = await Event.find({ visible: true, cancelled: false, eventEnd: { $gte: new Date() }}).populate('eventHost').populate({ path: 'eventHost', populate: { path: 'eventSystem' } }).sort({ eventStart: 'asc' });
    const meta = {
        title: `LARP Event Bookings: Upcoming Events for ${eventSystem.name}`,
        description: 'LARP Event Bookings - Event information and booking for LRP events across the United Kingdom',
        path: '/'
    }
    if (eventSystem)
        return res.render('about/eventSystem', {title: eventSystem.name, eventSystem, meta, events: eventList.filter(e => e.eventHost.eventSystem.equals(eventSystem._id))})
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