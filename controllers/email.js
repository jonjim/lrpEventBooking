const EmailRecord = require('../models/emailRecord')
const EventSystems = require('../models/eventSystems')
const EventHosts = require('../models/eventHost');

module.exports.listEmails = async (req,res,next) => {
    const emails = await EmailRecord.find().populate('user').populate('event').sort({ date: 'desc' });
    const eventSystems = await EventSystems.find({active:true})
    return res.render('admin/email/list', {title:'E-mail Records', emails: emails, eventSystems: eventSystems});
}

module.exports.sendEmail = async(req,res,next) => {
    if (['superAdmin'].includes(req.user.role)) {
        const eventHosts = (await EventHosts.find().populate('eventSystem')).filter(a => a.eventSystem.active == true && (a.eventSystem.systemRef == req.body.host || req.body.host == 'all'));
        const emailList = eventHosts.map(function(host) {
            return { 
                system: host.eventSystem.name,
                host: host.name,
                email: host.contactAddress  
            }
        })
        await new emailRecord({
            user: res.locals.user._id,
            message: req.body.message,
            subject: req.body.subject,
        }).save();
        res.render('email/adminCustomEmail', { title: `This is an important message about your Event System`, customMessage: req.body.message }, async function(err, str) {
            if (err) throw new ExpressError(err, 500)
            for (record of emailList){
                if (record.email.length > 0){
                    await emailService.sendEmail(record.email,`${record.system} - ${req.body.subject}`,str)
                }
            }
            res.sendStatus(200);
        })
    } else {
        req.flash('error', `You do not have permission to manage emails`)
        return res.redirect('/');
    }
}