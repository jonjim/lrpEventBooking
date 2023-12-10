const mongoose = require('mongoose');

const eventSystemSchema = new mongoose.Schema({
    name: String,
    description: String,
    img: String,
    website: String
})

module.exports = mongoose.model('eventSystems', eventSystemSchema);