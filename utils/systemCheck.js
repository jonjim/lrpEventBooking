function systemCheck(req, res, systemRef, user){
    const systemData = getSystemData(systemRef,user)
    switch(systemRef){
        case 'lorienTrust':
            if (typeof systemData?.playerId === 'undefined' ||systemData?.playerId === '') {
                req.flash('error', 'A Lorien Trust Player ID is required to play this event')
                res.redirect('/account?system=lt')
                return false;
            }
            if (typeof systemData?.character.characterName === 'undefined' || systemData?.character.characterName === '') {
                req.flash('error', 'A Lorien Trust Character Name is required to play this event')
                res.redirect('/account?system=lt')
                return false;
            }
            if (typeof systemData?.character.faction === 'undefined' || systemData?.character.faction === '') {
                req.flash('error', 'A Lorien Trust Faction is required to play this event')
                res.redirect('/account?system=lt')
                return false;
            }
            break;
        case 'twistedTales':
            if (typeof systemData?.character.characterName === 'undefined' || systemData?.character.characterName === '') {
                req.flash('error', 'A Twisted Tales Character Name is required to play this event')
                res.redirect('/account?system=tt')
                return false;
            }
        case 'jadeThrone':
            if (typeof systemData?.character.characterName === 'undefined' || systemData?.character.characterName === '') {
                req.flash('error', 'A Jade Throne Character Name is required to play this event')
                res.redirect('/account?system=jt')
                return false;
            }
            if (typeof systemData?.character.clan === 'undefined' || systemData?.character.clan === '') {
                req.flash('error', 'A Jade Throne Clan is required to play this event')
                res.redirect('/account?system=jt')
                return false;
            }
            break;
        case 'eldritchDays':
            break;
    }
    return true;
}

function getSystemData(systemRef, user){
    switch (systemRef) {
        case 'lorienTrust':
            return user?.lorienTrust;
        case 'twistedTales':
            return user?.twistedTales;
        case 'eldritchDays':
            return user?.eldritchDays;
        case 'jadeThrone':
            return user?.jadeThrone;
    }
}

async function bookingCheck(systemRef,user){
    switch (systemRef) {
        case 'lorienTrust':
            return {
                icName: user?.lorienTrust.character.characterName,
                faction: user?.lorienTrust.character.faction,
            } 
        case 'twistedTales':
            return {
                icName: user?.twistedTales.character.characterName,
                faction: '',
            } 
        case 'eldritchDays':
            return {
                icName: user?.eldritchDays.character.characterName,
                faction: ''
            } 
        case 'jadeThrone':
            return {
                icName: user?.jadeThrone.character.characterName,
                faction: user?.jadeThrone.character.clan,
            } 
    }
}

module.exports = { systemCheck, getSystemData, bookingCheck }