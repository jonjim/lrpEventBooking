const siteConfig = require('../models/siteConfig')
const EventSystems = require('../models/eventSystems')
const FAQ = require('../models/faq')

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

module.exports.eventSystem = async(req,res,next) => {
    const meta = {
        crawl: true
    }
    const eventSystem = await EventSystems.findOne({systemRef: req.params.id});
    res.render('about/eventSystem', {title: eventSystem.name, eventSystem, meta})
}