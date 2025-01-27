if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const mssql = require('mssql');

const { insertImage, insertCustomField } = require('./utils.js');
const importSiteConfig = require('./siteConfig')
const importFAQ = require('./faq')
const importEventSystems = require('./eventSystems')
const importEventHosts = require('./eventHosts')
const importEvents = require('./events')
const importUsers = require('./users')
const importEventBookings = require('./eventBookings')

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log('Connected to MongoDB');
        if (process.env.MSSQL) {
            mssql.connect(process.env.MSSQL)
                .then(async pool => {
                    console.log('Connected to MSSQL');
                    await importSiteConfig();
                    await importFAQ();
                    const eventSystemFields = await importEventSystems();
                    await importEventHosts();
                    await importEvents();
                    await importUsers(eventSystemFields);
                    await importEventBookings();
                    console.log("Import Completed");
                    process.exit();
                })
                .catch(err => {
                    console.log('Error connecting to MSSQL');
                    console.log(err);
                });
        }
    })
    .catch(err => {
        console.log('Error connecting to MongoDB');
        console.log(err);
    });
