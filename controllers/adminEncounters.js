const Event = require('../models/lrpEvent');
const Encounter = require('../models/encounter')
const Monster = require('../models/monster')
const moment = require('moment');

module.exports.index = async(req,res,next) => {
    const event = await Event.findById(req.params.id).populate('encounters');
    res.render('admin/encounters/index', {title:`${event.name} - Encounters`, event, moment})
}

module.exports.new = async (req, res) => {
    const event = await Event.findById(req.params.id);
    res.render('admin/encounters/new', { title: 'Create New Encounter', event, moment });
}

module.exports.create = async (req, res) => {
    const event = await Event.findById(req.params.id);
    const enc = new Encounter(req.body.encounter);
    enc.event = event;
    let tmpDate = new Date(req.body.encounter.day);
    console.log(tmpDate)
    let tmpDateString = tmpDate.toISOString();
    enc.date = new Date(`${tmpDateString.split('T')[0]}T${req.body.encounter.time}:00.000Z`);
    event.encounters.push(enc);
    enc.save();
    event.save();
    res.redirect(`/admin/events/${req.params.id}/encounters/${enc._id}`)
}

module.exports.editForm = async (req, res) => {
    const encounter = await Encounter.findById(req.params.encounterId).populate('event').populate({path:'event',populate: 'eventHost'}).populate('monsters.monster')
    const monsters = await Monster.find({ eventSystem: encounter.event.eventHost.eventSystem});
    res.render('admin/encounters/edit', { title: `Encounter: ${encounter.name}`, encounter, moment, event: encounter.event, monsters});
}

module.exports.update = async (req,res) => {
    let tmpDate = new Date(req.body.encounter.day);
    let tmpDateString = tmpDate.toISOString();
    req.body.encounter.date = new Date(`${tmpDateString.split('T')[0]}T${req.body.encounter.time}:00.000Z`);
    const enc = await Encounter.findByIdAndUpdate(req.params.encounterId,req.body.encounter);
    res.redirect(`/admin/events/${req.params.id}/encounters`)
}

module.exports.addComment = async (req, res) => {
    const encounter = await Encounter.findById(req.params.encounterId);
    const comment = {
        text: req.body.comment,
        authorName: `${req.user.firstname} ${req.user.surname}`,
        linkedAuthor: req.user._id,
        created: Date.now()
    }
    encounter.comments.push(comment);
    encounter.save();
    res.send(comment);
}

module.exports.addMonster = async (req,res) => {
    const encounter = await Encounter.findById(req.params.encounterId);
    const monster = await Monster.findById(req.body.monster)
    encounter.monsters.push(req.body);
    encounter.save();
    return res.render('admin/monsters/showMini', {monsterDetails: req.body, monster})
}

module.exports.deleteMonster = async(req,res) => {
    await Encounter.findByIdAndUpdate(req.params.encounterId, { $pull: { monsters: {_id: req.params.monsterId } }});
    const encounter = await Encounter.findById(req.params.encounterId);
    encounter.save();
    res.send('Ok');
}