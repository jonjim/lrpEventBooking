const FAQ = require('../models/faq');
const siteConfig = require('../models/siteConfig');
const { cloudinary } = require('../utils/cloudinary');

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

module.exports.editConfig = async(req, res, next) => {
    const config = await siteConfig.find();
    res.render('admin/about/config', { title: 'Edit System Settings', config: config[0] })
}

module.exports.postConfig = async(req, res, next) => {
    const config = await siteConfig.findByIdAndUpdate(req.body.configId, {...req.body }, { new: true });
    if (req.file) {
        config.siteLogo = req.file;
        config.siteLogo.url = req.file.path;
        await config.save();
    }
    res.locals.config = config;
    req.flash('success', 'System settings updated')
    res.redirect('/admin/config')
}

module.exports.delConfig = async(req, res, next) => {
    const config = await siteConfig.findOne();
    await cloudinary.uploader.destroy(config.siteLogo.filename);
    config.siteLogo = undefined;
    await config.save();
    res.locals.config = config;
    req.flash('success', 'Deleted site logo')
    res.redirect('/admin/config')
}