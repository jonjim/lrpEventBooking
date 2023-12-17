async function systemCheck(req, res, system, user) {
    const systemData = user[system.systemRef];
    if (typeof systemData?.customFields === 'undefined') {
        if (typeof user[system.systemRef].character.characterName === 'undefined' || user[system.systemRef].character.characterName === '') {
            req.flash('error', `A ${system.name} Character Name is required to play this event`);
            res.redirect(`/account?system=${system.systemRef}`)
            return false;
        }
        else return true;
    }
    for (field of systemData.customFields.filter(a => a.required)) {
        if (typeof user[system.systemRef].character.characterName === 'undefined' || user[system.systemRef].character.characterName === '') {
            req.flash('error', `A ${system.name} Character Name is required to play this event`);
            res.redirect(`/account?system=${system.systemRef}`)
            return false;
        }
        if (field.section === 'player') {
            if (typeof user[system.systemRef][field.name] === 'undefined' || user[system.systemRef][field.name] === '') {
                req.flash('error', `${system.name} ${field.label} is required to play this event`);
                res.redirect(`/account?system=${system.systemRef}`)
                return false;
            }
        }
        else if (field.section === 'character') {
            if (typeof user[system.systemRef].character[field.name] === 'undefined' || user[system.systemRef].character[field.name] === '') {
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