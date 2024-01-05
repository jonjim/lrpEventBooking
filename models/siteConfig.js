const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
    privacyPolicy: String,
    terms: String,
    techContactName: String,
    techContactEmail: String,
    paypalPercentage: Number,
    paypalFixedFee: Number,
    siteName: String,
    siteLogo: {
        url: String,
        filename: String
    },
    siteDescription: String,
    hostingCharge: {
        type: Number,
        default: 0
    },
    hostingPaypal: String
})

module.exports = mongoose.model('siteConfig', siteConfigSchema);