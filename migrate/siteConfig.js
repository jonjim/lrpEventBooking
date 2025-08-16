const mssql = require('mssql');
const SiteConfig = require('../models/siteConfig');
const { insertImage, importPageContent } = require('./utils.js');

module.exports = async function importSiteConfig() {
    let config = await SiteConfig.findOne();
    console.log('Importing config');
    const configLookup = await mssql.query`SELECT [ConfigID] FROM [Config].[Dat_General_Config]` 
    if (config) {
        if (configLookup.rowsAffected < 1){
            try {
                let request = new mssql.Request()
                    .input('techContactName', mssql.VarChar, config.techContactName)
                    .input('techContactEmail', mssql.VarChar, config.techContactEmail)
                    .input('siteName', mssql.VarChar, config.siteName)
                    .input('archivePeriod', mssql.Int, config.archivePeriod)
                    .input('siteDescription', mssql.VarChar, config.siteDescription)
                    .input('hostingCharge', mssql.Numeric, config.hostingCharge)
                    .input('hostingPaypal', mssql.VarChar, config.hostingPaypal)
                    .input('webhooksDiscord', mssql.VarChar, config.webhooks.discord);
                let result = await request.query`INSERT INTO [Config].[Dat_General_Config] (TechContactName,TechContactEmail,SiteName,ArchivePeriod,SiteDescription,HostingCharge,HostingPaypal,WebhooksDiscord) OUTPUT INSERTED.ConfigID VALUES (@techContactName,@techContactEmail,@siteName,@archivePeriod,@siteDescription,@hostingCharge,@hostingPaypal,@webhooksDiscord)`;
                console.log("   Inserted site config ID: " + result.recordset[0].ConfigID);

                
            }
            catch (error) {
                if (error.message.includes('duplicate key')) {
                    console.log(`   Site config already exists`);
                }
                else
                console.log(error.message);
            }
        }
        else {
            console.log('   Config file has already been imported')
        }
        console.log('Importing site pages')
        await importPageContent('Terms & Conditions',config.terms);
        await importPageContent('Privacy Policy', config.privacyPolicy);

    }
    else{
        console.log('   No config file found!')
    }
}