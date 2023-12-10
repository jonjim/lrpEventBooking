const FAQ = require('../models/faq');
const siteConfig = require('../models/siteConfig');

module.exports.policies = async(req, res, next) => {
    const config = await siteConfig.find();
    res.render('admin/about/policies', { title: 'Edit Site Policies', config: config[0] });
};

module.exports.listFaq = async(req, res, next) => {
    const faq = await FAQ.find();
    res.render('admin/about/listFaq', { title: 'Manage FAQ', faq });
}

module.exports.editFaq = async(req, res, next) => {
    const faq = await FAQ.findById(req.params.id);
    res.render('admin/about/editFaq', { title: 'Edit FAQ', faq })
}

module.exports.editFaqPost = async(req, res, next) => {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, {...req.body });
    req.flash('success', 'Updated FAQ');
    res.redirect('/admin/faq')
}

module.exports.createFaq = async(req, res, next) => {
    res.render('admin/about/createFaq', { title: 'Create new FAQ' });
}

module.exports.createFaqPost = async(req, res, next) => {
    await new FAQ({...req.body }).save();
    req.flash('success', 'Created FAQ');
    res.redirect('/admin/faq')
}

module.exports.deleteFaq = async(req, res, next) => {
    await FAQ.findByIdAndDelete(req.params.id);
    req.flash('error', 'Deleted FAQ');
    res.redirect('/admin/faq');
}

module.exports.policiesUpdate = async(req, res, next) => {
    const config = await siteConfig.find();
    config[0].privacyPolicy = req.body.privacyPolicy;
    config[0].terms = req.body.terms;
    config[0].save();
    req.flash('success', 'Site policies have been updated');
    res.render('admin/about/policies', { title: 'Edit Site Policies', config: config[0] });
}