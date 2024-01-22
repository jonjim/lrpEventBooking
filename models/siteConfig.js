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
}, {
    virtuals: {
        imgThumbnail: {
            get() {
                return this.siteLogo.url.replace('/upload', '/upload/c_fill,w_250,h_113');
            }
        }
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})


module.exports = mongoose.model('siteConfig', siteConfigSchema);