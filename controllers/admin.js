const eventHost = require('../models/eventHost');
const User = require('../models/user');
const emailService = require('../utils/email');
const EventSystems = require('../models/eventSystems')
const crypto = require('crypto');
const { cloudinary } = require('../utils/cloudinary');

module.exports.eventHosts = async(req, res, next) => {
    const eventHosts = await eventHost.find().populate('eventSystem');
    res.render('admin/eventHosts/eventHosts', { title: 'Edit Event Hosts', eventHosts })
}

module.exports.eventHostEdit = async(req, res, next) => {
    const host = await eventHost.findById(req.params.id).populate('eventSystem');
    const eventSystems = await EventSystems.find();
    res.render('admin/eventHosts/eventHostEdit', { title: `Edit ${host.name}`, host, eventSystems });
}

module.exports.eventHostUpdate = async(req, res, next) => {
    const host = await eventHost.findByIdAndUpdate(req.params.id, {...req.body });
    if (req.file) {
        host.img = req.file;
        await host.save();
    }
    req.flash('success', `${host.name} has been updated`);
    return res.redirect('/admin/hosts');
}

module.exports.deleteEventHost = async(req, res, next) => {
    const host = await eventHost.findByIdAndDelete(req.params.id);
    await cloudinary.uploader.destroy(host.img.filename);
    req.flash('success', 'Event Host Deleted');
    return res.redirect('/admin/hosts')
}

module.exports.deleteEventHostImg = async(req, res, next) => {
    const host = await eventHost.findById(req.params.id);
    await cloudinary.uploader.destroy(host.img.filename);
    host.img = undefined;
    host.save();
    req.flash('success', 'Event Host Image Deleted');
    return res.redirect('/admin/hosts')
}

module.exports.eventHostNewForm = async(req, res, next) => {
    const eventSystems = await EventSystems.find();
    return res.render('admin/eventHosts/eventHostNew', { title: 'Create new Event Host', eventSystems });
}

module.exports.createEventHost = async(req, res, next) => {
    await new eventHost({...req.body }).save();
    req.flash('success', `${req.body.name} created!`)
    return res.redirect('/admin/hosts')
}

module.exports.listUsers = async(req, res, next) => {
    const users = await User.find({}).populate('eventHosts');
    return res.render('admin/users/userList', { title: 'User Management', users: users });
};

module.exports.editUser = async(req, res, next) => {
    const user = await User.findById(req.params.id).populate('eventHosts');
    const hosts = await eventHost.find();
    return res.render('admin/users/editUser', { title: `Edit User: ${user.firstname} ${user.surname}`, user, eventHosts: hosts })
}

module.exports.delUser = async(req, res, next) => {
    await User.findByIdAndUpdate(req.params.id, { displayBookings: false })
    await User.findByIdAndDelete(req.params.id);
    return res.redirect('/admin/users');
}

module.exports.resetUserPassword = async(req, res, next) => {
    const user = await User.findById(req.params.id);
    var token = crypto.randomBytes(4).toString('hex');
    user.setPassword(token);
    await user.save();
    res.render('email/adminResetPassword', { password: token }, async function(err, str) {
        emailService.sendEmail(user.username, `Password Reset`, str);
        req.flash('success', 'A new password has been sent to the user');
        res.redirect(`/admin/users/`);
    })
}

module.exports.addHostToUser = async(req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, { $push: { eventHosts: req.params.host } });
    return res.redirect(`/admin/users/${req.params.id}`)
}

module.exports.delHostFromUser = async(req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, { $pull: { eventHosts: req.params.host } });
    return res.redirect(`/admin/users/${req.params.id}`)
}

module.exports.updateUser = async(req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, {...req.body });
    req.flash('success', `Account for ${user.firstname} ${user.surname} has been updated.`)
    return res.redirect('/admin/users')
}

module.exports.eventSystemList = async(req, res, next) => {
    const eventSystems = await EventSystems.find();
    return res.render('admin/eventSystems/list', { title: 'Manage Event Systems', eventSystems });
}

module.exports.eventSystemEdit = async(req, res, next) => {
    const eventSystem = await EventSystems.findById(req.params.id);
    return res.render('admin/eventSystems/edit', { title: 'Manage Event System', eventSystem });
}

module.exports.eventSystemDelete = async(req, res, next) => {
    await EventSystems.findByIdAndDelete(req.params.id);
    req.flash('success', 'Event System deleted');
    return res.redirect('/admin/systems')
}

module.exports.eventSystemAddField = async (req, res, next) => {
    req.body.required = typeof req.body.required != 'undefined' ? req.body.required == 'on' ? true : false : false;
    if (req.body.options != '') req.body.options = req.body.options.split(',');
    else req.body.options = undefined;
    await EventSystems.findByIdAndUpdate(req.params.id, { $push: { customFields: { ...req.body }  } })
    req.flash('success','Added Custom Field');
    res.redirect(`/admin/systems/${req.params.id}`)
}

module.exports.eventSystemDelImg = async(req, res, next) => {
    const eventSystem = await EventSystems.findById(req.params.id)
    await cloudinary.uploader.destroy(eventSystem.img.filename);
    eventSystem.img = undefined;
    await eventSystem.save();
    req.flash('success', 'Event System image removed');
    return res.redirect('/admin/systems')
}

module.exports.eventSystemUpdate = async (req, res, next) => {
    req.body.active = typeof req.body.active != 'undefined' ? req.body.active == 'on' ? true : false : false;
    const eventSystem = await EventSystems.findByIdAndUpdate(req.params.id, {...req.body }, { new: true });
    if (req.file) {
        eventSystem.img = req.file;
        await eventSystem.save();
    }
    req.flash('success', 'Event System Updated!')
    return res.redirect('/admin/systems')
}

module.exports.eventSystemNewForm = async(req, res, next) => {
    return res.render('admin/eventSystems/new', { title: 'Create new event system' })
}

module.exports.eventSystemNew = async(req, res, next) => {
    await new EventSystems({...req.body }).save();
    req.flash('success', 'New Event System Created');
    return res.redirect('/admin/systems')
}