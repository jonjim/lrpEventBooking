function systemCheck(req, res, eventSystem){
    if (eventSystem.name === "Lorien Trust") {
        if (typeof req.user.ltCharacter?.pid === 'undefined' || req.user.ltCharacter?.pid === '') {
            req.flash('error', 'A Lorien Trust Player ID is required to play this event')
            res.redirect('/account?system=lt')
            return false;
        }
        if (typeof req.user.ltCharacter?.characterName === 'undefined' || req.user.ltCharacter?.characterName === '') {
            req.flash('error', 'A Lorien Trust Character Name is required to play this event')
            res.redirect('/account?system=lt')
            return false;
        }
        if (typeof req.user.ltCharacter?.faction === 'undefined' || req.user.ltCharacter?.faction === '') {
            req.flash('error', 'A Lorien Trust Faction is required to play this event')
            res.redirect('/account?system=lt')
            return false;
        }
    }
    return true;
}

module.exports = { systemCheck }