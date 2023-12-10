const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
    question: String,
    answer: String,
    display: {
        type: Boolean,
        default: true
    }
})

module.exports = mongoose.model('faq', faqSchema);