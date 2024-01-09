async function systemCheck(req, res, system, user) {
    const userRecord = JSON.parse(JSON.stringify(user))
    const systemRecord = JSON.parse(JSON.stringify(system))
    const systemData = userRecord[systemRecord.systemRef];
    const prefix = ['i','e','a','o','u'].includes(system.name.toLowerCase().charAt(0)) ? 'An' : 'A';
    if (typeof systemData?.customFields === 'undefined') {
        if (typeof systemData?.character?.characterName === 'undefined' || systemData?.character?.characterName === '') {
            req.flash('error', `${prefix} ${system.name} Character Name is required to play this event`);
            req.session.returnTo = req.originalUrl;
            return res.redirect(`/account?system=${system.systemRef}`)
        }
        else return true;
    }
    for (field of systemData.customFields.filter(a => a.required)) {
        if (typeof systemData?.character?.characterName === 'undefined' || systemData?.character?.characterName === '') {
            req.flash('error', `${prefix} ${system.name} Character Name is required to play this event`);
            req.session.returnTo = req.originalUrl;
            return res.redirect(`/account?system=${system.systemRef}`)
        }
        if (field.section === 'player') {
            if (typeof systemData?.[field.name] === 'undefined' || systemData?.[field.name] === '') {
                req.flash('error', `${system.name} ${field.label} is required to play this event`);
                req.session.returnTo = req.originalUrl;
                return res.redirect(`/account?system=${system.systemRef}`)
            }
        }
        else if (field.section === 'character') {
            if (typeof systemData?.character?.[field.name] === 'undefined' || systemData?.character?.[field.name] === '') {
                req.flash('error', `${system.name} ${field.label} is required to play this event`);
                req.session.returnTo = req.originalUrl;
                return res.redirect(`/account?system=${system.systemRef}`)
            }
        }
    }
    return true;
}

async function attendeeUpdate(eventSystem,eventBooking) {
    const attendeeData = {
        booking: eventBooking,
        ticketType: eventBooking.eventTickets.filter(e => !['mealticket', 'mealticketchild', 'playerbunk', 'monsterbunk', 'staffbunk'].includes(e.ticketType))[0].ticketType,
        display: eventBooking.displayBooking,
        surname: eventBooking.surname,
        firstname: eventBooking.firstname,
    };
    if (typeof eventBooking.user != 'undefined'){
        const userRecord = JSON.parse(JSON.stringify(eventBooking.user))
        const systemRecord = JSON.parse(JSON.stringify(eventSystem))
        const systemData = userRecord[systemRecord.systemRef];
        //const characterData = eventBooking.user[eventSystem.systemRef]; 
        attendeeData.user = eventBooking.user;
        attendeeData.icName = systemData.character.characterName;
        if (typeof eventSystem.customFields !== 'undefined') {
            for (field of eventSystem.customFields.filter(a => a.display)) {
                if (field.section === 'player')
                    attendeeData[field.name] = systemData[field.name];
                else if (field.section === 'character')
                    attendeeData[field.name] = systemData.character[field.name];
            }
        }
    }
    return attendeeData;
}

module.exports = { systemCheck, attendeeUpdate }