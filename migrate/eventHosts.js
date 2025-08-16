const mssql = require('mssql');
const EventHosts = require('../models/eventHost');
const { insertImage } = require('./utils.js');

module.exports = async function importEventHosts() {
    const eventHosts = await EventHosts.find().populate('eventSystem');
    console.log('Importing event hosts');
    let counter = 0;
    if (eventHosts) {
        for (eventHost of eventHosts) {
            try {
                const img = eventHost.img?.url ? await insertImage(eventHost.img.url, eventHost.img.filename) : null;
                const systemLookup = await mssql.query`SELECT [SystemID] FROM [Systems].[Dat_Systems] WHERE [SystemRef] = ${eventHost.eventSystem.systemRef}`;
                const hostLookup = await mssql.query`SELECT [HostID] FROM [Systems].[Dat_Hosts] WHERE [Name]='${eventHost.name}' AND [SystemID]=${systemLookup.recordset[0].SystemID}`
                if (hostLookup.rowsAffected < 1){
                    const hostRequest = new mssql.Request()
                        .input('name', mssql.VarChar, eventHost.name)
                        .input('description', mssql.VarChar, eventHost.description)
                        .input('display', mssql.Bit, eventHost.display ? 1 : 0)
                        .input('eventSystemId', mssql.Int, systemLookup.recordset[0].SystemID)
                        .input('imgId', mssql.Int, img)
                        .input('contactAddress', mssql.VarChar, eventHost.contactAddress)
                        .input('paypalAddress', mssql.VarChar, eventHost.paypalAddress)
                        .input('paypalPercentage', mssql.Numeric(18,2), eventHost.paypalPercentage)
                        .input('paypalFixedFee', mssql.Numeric(18,2), eventHost.paypalFixedFee)
                        .input('terms', mssql.VarChar, eventHost.terms)
                        .input('webhookDiscord', mssql.VarChar, eventHost.webhooks?.discord);
                    const hostResult = await hostRequest.query`INSERT INTO [Systems].[Dat_Hosts] (Name,Description,Display,SystemID,ImageID,ContactAddress,Terms,WebhookDiscord) OUTPUT INSERTED.HostID VALUES (@name,@description,@display,@eventSystemId,@imgId,@contactAddress,@terms,@webhookDiscord)`;
                    console.log("   Inserted event host: " + eventHost.name);

                    const paymentInfoRequest = new mssql.Request()
                        .input('PaypalEmail', mssql.VarChar, eventHost.paypalAddress)
                        .input('HostID', mssql.Int, hostResult.recordset[0].HostID)
                        .input('PaypalPercentage', mssql.Numeric(10,2), eventHost.paypalPercentage)
                        .input('PaypalFixedFee', mssql.Numeric(10,2), eventHost.paypalFixedFee)
                    const paymentInfoResult = await paymentInfoRequest.query`INSERT INTO [Systems].[Lnk_Host_Payment_Provider] ([HostID],[PaymentProviderID],[Auth],[Percentage],[FixedFee])
                        SELECT @HostID, [PaymentProviderID],@PaypalEmail,@PaypalPercentage,@PaypalFixedFee
                        FROM [Payments].[Ref_Payment_Providers] WHERE [Name]='PayPal'`
                    console.log("       Inserted payment info for: " + eventHost.name)
                    counter++;
                }
                else {
                    console.log(`   ${eventHost.name} already exists`);
                }
            }
            catch (error) {
                if (error.message.includes('duplicate key')) {
                    console.log(`   ${eventHost.name} already exists`);
                }
                else 
                console.log(error.message)
            }
        }
        console.log(`Imported ${counter} of ${eventHosts.length} event hosts`)
    }
}