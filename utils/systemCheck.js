async function systemCheck(req, res, system, user) {
    const userRecord = JSON.parse(JSON.stringify(user))
    const systemRecord = JSON.parse(JSON.stringify(system))
    const systemData = userRecord[systemRecord.systemRef];
    if (typeof systemData?.customFields === 'undefined') {
        if (typeof systemData?.character?.characterName === 'undefined' || systemData?.character?.characterName === '') {
            req.flash('error', `A ${system.name} Character Name is required to play this event`);
            return res.redirect(`/account?system=${system.systemRef}`)
            return false;
        }
        else return true;
    }
    for (field of systemData.customFields.filter(a => a.required)) {
        if (typeof systemData?.character?.characterName === 'undefined' || systemData?.character?.characterName === '') {
            req.flash('error', `A ${system.name} Character Name is required to play this event`);
            res.redirect(`/account?system=${system.systemRef}`)
            return false;
        }
        if (field.section === 'player') {
            if (typeof systemData?.[field.name] === 'undefined' || systemData?.[field.name] === '') {
                req.flash('error', `${system.name} ${field.label} is required to play this event`);
                res.redirect(`/account?system=${system.systemRef}`)
                return false;
            }
        }
        else if (field.section === 'character') {
            if (typeof systemData?.character?.[field.name] === 'undefined' || systemData?.character?.[field.name] === '') {
                req.flash('error', `${system.name} ${field.label} is required to play this event`);
                res.redirect(`/account?system=${system.systemRef}`)
                return false;
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
        const characterData = eventBooking.user[eventSystem.systemRef]; 
        attendeeData.user = eventBooking.user;
        attendeeData.icName = characterData.character.characterName;
        if (typeof eventSystem.customFields !== 'undefined') {
            for (field of eventSystem.customFields.filter(a => a.display)) {
                if (field.section === 'player')
                    attendeeData[field.name] = characterData[field.name];
                else if (field.section === 'character')
                    attendeeData[field.name] = characterData.character[field.name];
            }
        }
    }
    return attendeeData;
}

module.exports = { systemCheck, attendeeUpdate }