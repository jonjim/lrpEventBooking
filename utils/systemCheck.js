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

module.exports = { systemCheck }