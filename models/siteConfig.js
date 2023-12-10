const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
    privacyPolicy: String,
    terms: String,
    techContactName: String,
    techContactEmail: String,
    paypalPercentage: Number,
    paypalFixedFee: Number,
    siteName: String,
    siteLogo: String,
    siteDescription: String
})

module.exports = mongoose.model('siteConfig', siteConfigSchema);