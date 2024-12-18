const eventHost = require('../models/eventHost');
const User = require('../models/user');
const emailService = require('../utils/email');
const EventSystems = require('../models/eventSystems')
const crypto = require('crypto');
const { cloudinary } = require('../utils/cloudinary');
const eventBooking = require('../models/eventBooking');

module.exports.eventHosts = async(req, res, next) => {
    const eventHosts = await eventHost.find().populate('eventSystem');
    res.render('admin/eventHosts/eventHosts', { title: 'Edit Event Hosts', eventHosts })
}

module.exports.eventHostEdit = async(req, res, next) => {
    const host = await eventHost.findById(req.params.id).populate('eventSystem');
    if (req.user.eventSystems.includes(host.eventSystem._id) || res.locals.currentUser.eventHosts.includes(host._id) || res.locals.adminGroups.includes(req.user.role)){
        const eventSystems = await EventSystems.find();
        return res.render('admin/eventHosts/eventHostEdit', { title: `Edit ${host.name}`, host, eventSystems });
    }
    else{
        req.flash('error','You are not authorised to do that!')
        return res.redirect('/')
    }
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
    const user = await User.findById(req.params.id).populate('eventHosts').populate('eventSystems');
    const bookings = await eventBooking.find({ user: user }).populate('event').populate('eventTickets');
    const hosts = await eventHost.find();
    const systems = await EventSystems.find();
    return res.render('admin/users/editUser', { title: `Edit User: ${user.firstname} ${user.surname}`, user, eventHosts: hosts, eventSystems: systems, eventBookings: bookings })
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
    res.render('email/adminResetPassword', { password: token, title: 'An admin has requested to reset your password.' }, async function(err, str) {
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

module.exports.addSystemToUser = async(req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, { $push: { eventSystems: req.params.system } });
    return res.redirect(`/admin/users/${req.params.id}`)
}

module.exports.delSystemFromUser = async(req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, { $pull: { eventSystems: req.params.system } });
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
    req.body.display = typeof req.body.display != 'undefined' ? req.body.display == 'on' ? true : false : false;
    if (req.body.options != '') req.body.options = req.body.options.split(',');
    else req.body.options = undefined;
    await EventSystems.findByIdAndUpdate(req.params.id, { $push: { customFields: { ...req.body }  } })
    req.flash('success','Added Custom Field');
    res.redirect(`/admin/systems/${req.params.id}`)
}

module.exports.eventSystemAddLammieField = async (req, res, next) => {
    req.body.required = typeof req.body.required != 'undefined' ? req.body.required == 'on' ? true : false : false;
    req.body.display = typeof req.body.display != 'undefined' ? req.body.display == 'on' ? true : false : false;
    if (req.body.options != '') req.body.options = req.body.options.split(',');
    else req.body.options = undefined;
    await EventSystems.findByIdAndUpdate(req.params.id, { $push: { lammieFields: { ...req.body }  } })
    req.flash('success','Added Custom Lammie Field');
    res.redirect(`/admin/systems/${req.params.id}`)
}

module.exports.eventSystemUpdateField = async (req, res, next) => {
    const fieldId = req.body.idField;
    req.body.idField = undefined;
    req.body.required = typeof req.body.required != 'undefined' ? req.body.required == 'on' ? true : false : false;
    req.body.display = typeof req.body.display != 'undefined' ? req.body.display == 'on' ? true : false : false;
    if (req.body.options != '') req.body.options = req.body.options.split(',');
    else req.body.options = undefined;
    await EventSystems.findByIdAndUpdate(req.params.id, { $pull: { customFields: { _id: fieldId } } });
    await EventSystems.findByIdAndUpdate(req.params.id, { $push: { customFields: { ...req.body } } });
    req.flash('success','Updated Custom Field');
    res.redirect(`/admin/systems/${req.params.id}`)
}

module.exports.eventSystemUpdateLammieField = async (req, res, next) => {
    const fieldId = req.body.idField;
    req.body.idField = undefined;
    req.body.required = typeof req.body.required != 'undefined' ? req.body.required == 'on' ? true : false : false;
    req.body.display = typeof req.body.display != 'undefined' ? req.body.display == 'on' ? true : false : false;
    if (req.body.options != '') req.body.options = req.body.options.split(',');
    else req.body.options = undefined;
    await EventSystems.findByIdAndUpdate(req.params.id, { $pull: { lammieFields: { _id: fieldId } } });
    await EventSystems.findByIdAndUpdate(req.params.id, { $push: { lammieFields: { ...req.body } } });
    req.flash('success','Updated Custom Lammie Field');
    res.redirect(`/admin/systems/${req.params.id}`)
}

module.exports.eventSystemDeleteField = async (req, res, next) => {
    await EventSystems.findByIdAndUpdate(req.params.id, { $pull: { customFields: { _id: req.body.idField } } });
    req.flash('success','Deleted Custom Field');
    res.redirect(`/admin/systems/${req.params.id}`)
}

module.exports.eventSystemDeleteLammieField = async (req, res, next) => {
    await EventSystems.findByIdAndUpdate(req.params.id, { $pull: { lammieFields: { _id: req.body.idField } } });
    req.flash('success','Deleted Custom Lammie Field');
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
    if (req.body.customTools != '') req.body.customTools = req.body.customTools.split(',');
    else req.body.customTools = undefined;
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

module.exports.eventSystemAddLammieField = async (req, res, next) => {
    req.body.required = typeof req.body.required != 'undefined' ? req.body.required == 'on' ? true : false : false;
    req.body.display = typeof req.body.display != 'undefined' ? req.body.display == 'on' ? true : false : false;
    if (req.body.options != '') req.body.options = req.body.options.split(',');
    else req.body.options = undefined;
    await EventSystems.findByIdAndUpdate(req.params.id, { $push: { lammieFields: { ...req.body }  } })
    req.flash('success','Added Custom Field');
    res.redirect(`/admin/systems/${req.params.id}`)
}

module.exports.eventSystemUpdateLammieField = async (req, res, next) => {
    const fieldId = req.body.idField;
    req.body.idField = undefined;
    req.body.required = typeof req.body.required != 'undefined' ? req.body.required == 'on' ? true : false : false;
    req.body.display = typeof req.body.display != 'undefined' ? req.body.display == 'on' ? true : false : false;
    if (req.body.options != '') req.body.options = req.body.options.split(',');
    else req.body.options = undefined;
    await EventSystems.findByIdAndUpdate(req.params.id, { $pull: { lammieFields: { _id: fieldId } } });
    await EventSystems.findByIdAndUpdate(req.params.id, { $push: { lammieFields: { ...req.body } } });
    req.flash('success','Updated Custom Field');
    res.redirect(`/admin/systems/${req.params.id}`)
}

module.exports.eventSystemDeleteLammieField = async (req, res, next) => {
    await EventSystems.findByIdAndUpdate(req.params.id, { $pull: { lammieFields: { _id: req.body.idField } } });
    req.flash('success','Deleted Custom Field');
    res.redirect(`/admin/systems/${req.params.id}`)
}