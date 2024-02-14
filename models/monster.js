const mongoose = require('mongoose');


const monsterSchema = new mongoose.Schema({
    name: String, 
    race: String,
    type: String,
    eventSystem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'eventSystems'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lhv: String,
    strikesFor: String,
    immunities: String,
    summoningAbility: String,
    abilityOne: String,
    abilityTwo: String,
    abilityThree: String,
    restrictionsNotes: String,
    upstats: String,
    roleplayGuidelines: String, 
    makeupNotes: String,
    comments: [{
        text: String,
        authorName: String,
        linkedAuthor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        created: Date,
    }],
});

module.exports = mongoose.model('Monster', monsterSchema);