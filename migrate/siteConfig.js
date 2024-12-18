const mssql = require('mssql');
const SiteConfig = require('../models/siteConfig');
const { insertImage } = require('./utils.js');

module.exports = async function importSiteConfig() {
    let config = await SiteConfig.findOne();
    console.log('Importing config');
    if (config) {
        try {
            let imageId = config.siteLogo ? await insertImage(config.siteLogo.url, config.siteLogo.filename) : null;
            let request = new mssql.Request()
                .input('legacyId', mssql.VarChar, config._id)
                .input('privacyPolicy', mssql.VarChar, config.privacyPolicy)
                .input('terms', mssql.VarChar, config.terms)
                .input('techContactName', mssql.VarChar, config.techContactName)
                .input('techContactEmail', mssql.VarChar, config.techContactEmail)
                .input('paypalPercentage', mssql.Numeric, config.paypalPercentage)
                .input('paypalFixedFee', mssql.Numeric, config.paypalFixedFee)
                .input('siteName', mssql.VarChar, config.siteName)
                .input('archivePeriod', mssql.Int, config.archivePeriod)
                .input('siteLogoId', mssql.Int, imageId)
                .input('ogCardId', mssql.Int, null)
                .input('siteDescription', mssql.VarChar, config.siteDescription)
                .input('hostingCharge', mssql.Numeric, config.hostingCharge)
                .input('hostingPaypal', mssql.VarChar, config.hostingPaypal)
                .input('webhooksDiscord', mssql.VarChar, config.webhooks.discord);
            let result = await request.query`INSERT INTO site_config (legacyId, privacyPolicy,terms,techContactName,techContactEmail,paypalPercentage,paypalFixedFee,siteName,archivePeriod,siteLogoId,ogCardId,siteDescription,hostingCharge,hostingPaypal,webhooksDiscord) OUTPUT INSERTED.Id VALUES (@legacyId,@privacyPolicy,@terms,@techContactName,@techContactEmail,@paypalPercentage,@paypalFixedFee,@siteName,@archivePeriod,@siteLogoId,@ogCardId,@siteDescription,@hostingCharge,@hostingPaypal,@webhooksDiscord)`;
            console.log("Inserted site config ID: " + result.recordset[0].Id);
        }
        catch (error) {
            if (error.message.includes('duplicate key')) {
                console.log(`   Site config already exists`);
            }
            else
            console.log(error.message);
        }
    }
}