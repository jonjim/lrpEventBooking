const mssql = require('mssql');
const EventHosts = require('../models/eventHost');
const { insertImage } = require('./utils.js');

module.exports = async function importEventHosts() {
    const eventHosts = await EventHosts.find();
    console.log('Importing event hosts');
    let counter = 0;
    if (eventHosts) {
        for (eventHost of eventHosts) {
            try {
                const img = eventHost.img?.url ? await insertImage(eventHost.img.url, eventHost.img.filename) : null;
                const systemLookup = await mssql.query`SELECT [id] FROM [dbo].[event_systems] WHERE [legacyId] = ${eventHost.eventSystem}`;
                const hostRequest = new mssql.Request()
                    .input('legacyId', mssql.VarChar, eventHost._id)
                    .input('name', mssql.VarChar, eventHost.name)
                    .input('description', mssql.Text, eventHost.description)
                    .input('display', mssql.Bit, eventHost.display ? 1 : 0)
                    .input('eventSystemId', mssql.Int, systemLookup.recordset[0].id)
                    .input('imgId', mssql.Int, img)
                    .input('contactAddress', mssql.VarChar, eventHost.contactAddress)
                    .input('paypalAddress', mssql.VarChar, eventHost._id)
                    .input('paypalPercentage', mssql.Numeric, eventHost.paypalPercentage)
                    .input('paypalFixedFee', mssql.Numeric, eventHost.paypalFixedFee)
                    .input('terms', mssql.Text, eventHost.terms)
                    .input('webhookDiscord', mssql.VarChar, eventHost.webhooks?.discord);
                const hostResult = await hostRequest.query`INSERT INTO event_hosts (legacyId,name,description,display,eventSystemId,imgId,contactAddress,paypalAddress,paypalPercentage,paypalFixedFee,terms,webhookDiscord) OUTPUT INSERTED.Id VALUES (@legacyId,@name,@description,@display,@eventSystemId,@imgId,@contactAddress,@paypalAddress,@paypalPercentage,@paypalFixedFee,@terms,@webhookDiscord)`;
                console.log("   Inserted event host: " + eventHost.name);
                counter++;
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