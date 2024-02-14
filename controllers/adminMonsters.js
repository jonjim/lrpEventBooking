const Monster = require('../models/monster')
const EventHost = require('../models/eventHost')
const EventSystem = require('../models/eventSystems')

module.exports.index = async(req, res,next) => {
    if (res.locals.adminGroups.includes(req.user.role)){
        const monsters = await Monster.find().populate('eventSystem');
        const systemList = monsters.map(x => x.eventSystem._id);
        res.render('admin/monsters/index', { title: 'Monster Manual', monsters, systemList });
    } 
    else {
        const eventHosts = await EventHost.find({ _id: { $in: req.user.eventHosts}}).populate('eventSystem');
        const systemList = eventHosts.map(x => x.eventSystem._id);
        systemList.push(...req.user.eventSystems);
        const monsters = await Monster.find({ eventSystem: {$in: systemList }}).populate('eventSystem');
        res.render('admin/monsters/index', { title: 'Monster Manual', monsters, systemList });
    }
};

module.exports.new = async(req, res,next) => {
    const eventHosts = await EventHost.find({ _id: { $in: req.user.eventHosts}}).populate('eventSystem');
    const systemList = eventHosts.map(x => x.eventSystem._id);
    systemList.push(...req.user.eventSystems);
    const eventSystems = await EventSystem.find({_id: {$in: systemList}});
    res.render('admin/monsters/new', { title: 'Create New Monster', eventSystems })
}

module.exports.edit = async(req,res,next) => {
    const monster = await Monster.findById(req.params.id);
    const eventHosts = await EventHost.find({ _id: { $in: req.user.eventHosts}}).populate('eventSystem');
    const systemList = eventHosts.map(x => x.eventSystem._id);
    systemList.push(...req.user.eventSystems);
    const eventSystems = await EventSystem.find({_id: {$in: systemList}});
    return res.render('admin/monsters/edit',{title:'Edit Monster',monster, eventSystems})
}

module.exports.create = async(req, res,next) => {
    req.body.monster.author = req.user._id;
    await new Monster(req.body.monster).save();
    res.redirect('/admin/monsters')
}