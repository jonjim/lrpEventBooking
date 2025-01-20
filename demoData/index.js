if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const eventHost = require('../models/eventHost');
const EventSystems = require('../models/eventSystems');

const buildDemoData = async() => {
    // Add Event System
    const lrpTicketsEventSystem = await new EventSystems({
        "img": {
            "filename": "lrpEvents/mq8imizqf0vwbyf1xky9",
            "url": "https://res.cloudinary.com/dapc3dsxv/image/upload/v1702296966/lrpEvents/mq8imizqf0vwbyf1xky9.jpg"
        },
        "active": true,
        "customTools": [],
        "name": "LRP Tickets Demo",
        "description": "<p>LRP Tickets introduces a brand new and entirely fictional event system.</p><h1>Boasting an entirely imaginary world</h1><p>Enjoy a game world that doesn't really exist, and embrace storylines that will never come to life</p><h1>Purely Fictional Playerbase</h1>Never worry about awkwardly bumping into someone from work. All our players are as fictional as the characters they play!</p>",
        "website": "https://grangelrp.com/Jade-Throne.php",
        "terms": "",
        "systemRef": "lrpTickets",
        "customFields": [],
        "demoData": true
    }).save();

    // Add Event Host
    const host1 = await new eventHost({
        eventSystem: lrpTicketsEventSystem._id,
        name: 'Demo Host 1',
        display: false,
        img: {
            filename: "lrpEvents/rqwsrr29nwiobfnw3y9m",
            url: "https://res.cloudinary.com/dapc3dsxv/image/upload/v1702326644/lrpEvents/rqwsrr29nwiobfnw3y9m.png"
        },
        contactAddress: 'enquiries@lrptickets.co.uk',
        paypalAddress: 'enquiries@lrptickets.co.uk',
        demoData: true
    }).save();

}

buildDemoData().then(() => {
    mongoose.connection.close();
})