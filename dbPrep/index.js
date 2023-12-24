if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const eventHost = require('../models/eventHost');
const lorienTrustHosts = require('./lorienTrust.json');
const jadeThroneHosts = require('./jadeThrone.json');
const sampleEvents = require('./sampleEvents.json');
const faq = require('./faq.json');
const siteConfig = require('../models/siteConfig');
const EventSystems = require('../models/eventSystems');
const FAQ = require('../models/faq')
const LrpEvent = require('../models/lrpEvent');

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.log('Error connection to MongoDB');
        console.log(err);
    });

const seedDB = async() => {
    const findConfig = await siteConfig.find();
    if (findConfig.length === 0)
        await new siteConfig({
            privacyPolicy: '',
            terms: '',
            techContactName: '',
            techContactEmail: '',
            paypalPercentage: 1.2,
            paypalFixedFee: 0.30,
            siteName: 'LARP Event Bookings',
            siteDescription: 'LARP Event Bookings - Event information and booking for LRP events across the United Kingdom'
        }).save();
    
    const lorienTrust = await new EventSystems({
        "img": {
            "filename": "lrpEvents/habdxwu8tk18kwkouckh",
            "url": "https://res.cloudinary.com/dapc3dsxv/image/upload/v1702296587/lrpEvents/habdxwu8tk18kwkouckh.png"
          },
          "name": "Lorien Trust",
          "description": "<p class=\"fusion-title-heading title-heading-left fusion-responsive-typography-calculated\">The Lorien Trust was formed in late 1991 after a group of experienced live role-players (larper&rsquo;s) decided to run something better than the events that had been run before.</p>\r\n<p class=\"fusion-title-heading title-heading-left fusion-responsive-typography-calculated\">Over the past 30 years the Lorien Trust has continued to provide one of the best festival scale live role play systems available, and has continued to grow and adapt with our players.&nbsp;</p>",
          "website": "https://www.lorientrust.com",
          "terms": "<h2>General Rules and Regulations of The Lorien Trust Game and Events</h2>\r\n<ul>\r\n<li>You agree to comply with and be bound by the Lorien Trust (LT) game rules. The Lorien Trusts decision is final in all disputes concerning the game rules.</li>\r\n<li>The Live Action Role Playing (LARP) hobby involves the use of specially manufactured LARP weapons, all participants at Lorien Trust events agree that LARP weapons may be used on them during&nbsp;participation.</li>\r\n<li>Anyone found using a LARP weapon in a dangerous manner will be warned of their actions and/or may be removed from the event at organiser&rsquo;s discretion.</li>\r\n<li>Metal or other non-LARP weapons must never be brought to Lorien Trust events. The game world of Erdreja does not and will not allow gunpowder/fire arms and although there is goblin/dwarven&nbsp;engineering no items may resemble a replica firearm of any description i.e. gun, cannons, blunderbuss,&nbsp;flintlock etc. If you have any such item do not bring them to events. If you have one that has a lammie&nbsp;attached remove the lammie and bring that to the Game Control leaving the replica gun at home. No&nbsp;one is allowed to bring these items to the field including Traders, anyone found in the field with such&nbsp;items will be asked to return it to their vehicle and not bring them to future events or face the item being&nbsp;confiscated.</li>\r\n<li>Reasonable camping knives are permitted but can only be used in your camp and must be kept in your tent.</li>\r\n<li>The Lorien Trust reserve the right to confiscate/ban, any weapon or any item of equipment it deems to be unsuitable or inappropriate. Any confiscated item Must be collected from the Main Security Point, prior to you leaving the event, any uncollected items will be kept for a maximum of one year after the event and may then be disposed of.</li>\r\n<li>The Lorien Trust will inform the authorities if anyone is discovered breaking the law.</li>\r\n<li>The Lorien Trust will charge you for the repair or replacement value of any Lorien Trust or event location property that you have lost, damaged, vandalised or destroyed.</li>\r\n<li>No child under 16 will be permitted to take part in any large battles.</li>\r\n<li>Our gate issued security wristband must be attached to your wrist upon entry and then worn at all times during that event.</li>\r\n<li>No pyrotechnics, fireworks or theatrical smoke producing devices are allowed to be brought to any Lorien Trust event by customers.</li>\r\n<li>No trading will be permitted without a valid Lorien Trust trading licence.</li>\r\n<li>Any player caught cheating will be warned. If they persist, they will be penalised and may be removed from the event. This includes failing to adhere to the &ldquo;spirit of the game&rdquo;.</li>\r\n<li>The Lorien Trust run family friendly events. You are required to maintain a reasonable standard of decency, both physically and verbally.</li>\r\n<li>Lorien Trust LARP events are there for everyone to enjoy equally and safely without fear of harm, discrimination or harassment. Intentionally disruptive or harmful behaviour may result in expulsion from the event. If the situation requires, the authorities may be informed.</li>\r\n</ul>\r\n<h2><br>Spirit of the Game at Lorien Trust Events</h2>\r\n<p>All participants at Lorien Trust events are required to uphold the spirit (not just the letter) of the rules.<br>Volunteers can only make decisions based on the information at hand and the ultimate aim of live roleplaying is to have fun.<br>Role-playing a character in such a way as to deliberately upset others out-of-character is not within&nbsp;the Spirit of the rules. The Lorien Trust would like to ask all participants to leave out-of-character&nbsp;disagreements with other people outside the event.</p>",
          "systemRef": "lorienTrust",
          "customFields": [
            {
              "label": "Player ID",
              "name": "playerId",
              "type": "number",
              "options": [],
              "required": true,
              "section": "player",
              "defaultValue": "",
              "description": "",
              "placeholder": "",
              "error": "                        <p>If you do not know your Player ID you can find it in the top right corner of your Lorien Trust Character Card, or by logging into your account on the <a href=\"https://www.lorientrust.com\" target=\"_blank\" class=\"alert-link\">Lorien Trust website</a></p>                         <hr>                         <p class=\"mb-0\">If you have not attended a Lorien Trust event before, please <a class=\"alert-link\" onclick=\"document.getElementById('playerID').value = 0;return false;\" href=\"#\">click here.</a></p>",
              "display": false
            },
            {
              "label": "Referee / Marshal Number",
              "name": "refereeMarshalNumber",
              "type": "text",
              "options": [],
              "required": false,
              "section": "player",
              "defaultValue": "",
              "description": "",
              "placeholder": "",
              "error": "",
              "display": false
            },
            {
              "label": "Faction",
              "name": "faction",
              "type": "select",
              "options": [
                "No-Faction",
                "Bears",
                "Dragons",
                "Gryphons",
                "Harts",
                "Jackals",
                "Lions",
                "Tarantulas",
                "Unicorns",
                "Vipers",
                "Wolves"
              ],
              "required": true,
              "section": "character",
              "defaultValue": "",
              "description": "",
              "placeholder": "",
              "error": "You must select a Faction to play Lorien Trust events",
              "display": true
            },
            {
              "label": "Claw Competency",
              "name": "clawCompetency",
              "type": "checkbox",
              "options": [],
              "required": false,
              "section": "player",
              "defaultValue": "",
              "description": "Do you have a valid Claw Competency",
              "placeholder": "",
              "error": "",
              "display": false
            },
            {
              "label": "Bow Competency",
              "name": "bowCompetency",
              "type": "checkbox",
              "options": [],
              "required": false,
              "section": "player",
              "defaultValue": "",
              "description": "Do you have a valid Bow Competency",
              "placeholder": "",
              "error": "",
              "display": false
            }
          ],
          "active": true,
          "customTools": [
            "lorienTrust.ejs"
          ]
    }).save();
    const twistedTales = await new EventSystems({
        "img": {
            "filename": "lrpEvents/n9wzcogl0o0lco8q5v1m",
            "url": "https://res.cloudinary.com/dapc3dsxv/image/upload/v1702297296/lrpEvents/n9wzcogl0o0lco8q5v1m.png"
          },
          "customTools": [],
          "name": "Twisted Tales",
          "description": "<p>We are a small LRP group who over the last 20 years who have run events and provided props, logistics and support to help teams run their own events for a wide variety of systems.</p>\r\n<p>We have also been running escape rooms in various settings.</p>\r\n<p>The Twisted Tales LRP team is :<br>Nic Doran, Dena Lewis and Steph Waldron.</p>\r\n<p>If you would like to talk to us about helping running an event just drop us an email.</p>\r\n<p>In addition for the last 4 years we have had our own small event live roleplaying system for players over 18, based on dark and grim faery tales of evil fae, dark woods, dastardly monsters and brutal heroes. Twisted Tales was voted Best Small LARP and Best Overall LARP 2016 at the UK LARP Awards.</p>",
          "website": "https://twisted-tales.org.uk/",
          "terms": "<h2>In Booking For A Twisted Tales LRP ('The Organisers') Event, You Acknowledge And Agree:</h2>\r\n<ul>\r\n<li>Twisted Tales LRP or any persons so appointed by Twisted Tales LRP cannot be held personally liable for any injury or damage to any individual participating in any Twisted Tales LRP event as permitted by law.</li>\r\n<li>Twisted Tales LRP cannot be held responsible for any damage to, loss of, or theft of any personal or communal property during any event. Lost property can be handed in or collected from Games Control at the event and will be held for 1 year following the event by the Organisers</li>\r\n<li>LRP is a potentially dangerous hobby and I will act in a reasonable and safe manner during any LRP event and follow any and all reasonable instructions provided by the Organisers.</li>\r\n<li>I understand and agree that Twisted Tales LRP reserves the right to refuse admission or participation in any event or part of an event to any individual at any time. The Organisers are not obliged to give any reason or explanation for such a decision, but one may be supplied after following the event if requested in writing.</li>\r\n<li>Metal weapons or tools are NOT to be brought onto site. Only LRP safe weapons can be used subject to checking at Games Control. Any unsafe weapons should be returned to your vehicle or stored by Games Control.</li>\r\n<li>Any non-combat props should be presented for a safety check on registration.</li>\r\n<li>To comply with the LRP system rules as relevant to the event, the rules system in effect (for example Lorien Trust) to be made clear on the booking page.</li>\r\n<li>No controlled substances other than legitimately prescribed drugs will be tolerated on site.</li>\r\n<li>The Organisers will expel any individual engaged in illegal, defamatory, or dangerous practices during the event and the relevant authorities may be contacted. Individuals expelled from the event as a result of breach of these terms and conditions shall not be entitled to a refund.</li>\r\n<li>Only individuals authorised by the event Organiser may act as or hold themselves out to be (whether by act or omission) referees, marshals or directors of plot (as relevant) at Twisted Tales LRP run events.</li>\r\n<li>Bookings may be cancelled within 28 days of receipt of payment, and no later than 14 days prior to the event date. Outside of this 28-day period any cancellation may be subject to a &pound;5 cancellation fee at the Organisers&rsquo; discretion. In lieu of a refund the Organisers may allow the booking to be transferred to another player, or deferred to another event run by Twisted Tales LRP.</li>\r\n<li>The decision of the Organisers is final in all disputes.</li>\r\n</ul>\r\n<h2>By Using This Website, You Acknowledge That</h2>\r\n<p>Your details will be stored and used for the purposes of booking and administering events run by Twisted Tales LRP, in line with our&nbsp;<a href=\"https://events.tarantulafaction.com/privacy.php\" target=\"_blank\" rel=\"noopener\">Privacy Policy</a></p>",
          "systemRef": "twistedTales",
          "active": true,
          "customFields": []
    }).save();
    const jadeThrone = await new EventSystems({
        "img": {
            "filename": "lrpEvents/mq8imizqf0vwbyf1xky9",
            "url": "https://res.cloudinary.com/dapc3dsxv/image/upload/v1702296966/lrpEvents/mq8imizqf0vwbyf1xky9.jpg"
          },
          "active": true,
          "customTools": [],
          "name": "Jade Throne",
          "description": "<p>The Jade Throne is a Live Action Role Playing (LARP) game set in Tokoro, a fictional version of a mix of ancient feudal Japan, ancient feudal China and ancient Greece where players play characters who are samurai living within the rigid and intricate social structure of courtly games, family feuds, glorious deeds and powerful beings.</p>",
          "website": "https://grangelrp.com/Jade-Throne.php",
          "terms": "",
          "systemRef": "jadeThrone",
          "customFields": []
    }).save();
    const eldritchDays = await new EventSystems(
        {
            "img": {
              "filename": "lrpEvents/masgszkq8hltbhwhzukl",
              "url": "https://res.cloudinary.com/dapc3dsxv/image/upload/v1702296981/lrpEvents/masgszkq8hltbhwhzukl.jpg"
            },
            "name": "Eldritch Days",
            "description": "<p>Eldritch Days (ED) is a science-fantasy Live Action Role-Playing game (LARP), heavily influenced by the Cthulhu Mythos and draws additional inspiration from the dieselpunk, post-apocalypse, and fantasy genres.</p>\r\n<p>Set in an alternative history of the 20th Century where the world has been torn apart by war and chaos, magic surpasses technology in the fight against the eldritch horrors set on destroying the Multi-Verse.</p>\r\n<p>The year is 1975. The world has been engaged in perpetual warfare since 1925. Technological progress and cultural advancement have stagnated. Governments have been overthrown. Millions have died in the fighting. Countries have ceased to exist altogether, while others have isolated themselves.</p>\r\n<p>Player characters are Awakened Humans- people who have an inherent ability to tap into and manipulate dimensional energy to cast spells and perform rituals (among other things). They are invited to join Deep Six, an umbrella organisation of secret societies, where they might learn to harness their abilities and use them to combat the dangers posed by the malevolent beings who exist throughout the Multi-Verse.</p>\r\n<p>While each organisation within Deep Six - DS Alpha, the Temple, and the Society - have their own goals and agendas, they all agree on these objectives: to contain dimensional anomalies, protect the world from threats originating from the Mult-Verse and stop the Elder Gods from awakening Azathoth.</p>",
            "website": "https://www.facebook.com/groups/eldritchdayslarp",
            "terms": "",
            "systemRef": "eldritchDays",
            "active": true,
            "customTools": [
              ""
            ],
            "customFields": []
          }
    ).save();
    await new eventHost({
        eventSystem: twistedTales._id,
        name: 'Twisted Tales',
        display: false,
        img: {
            filename: "lrpEvents/rqwsrr29nwiobfnw3y9m",
            url: "https://res.cloudinary.com/dapc3dsxv/image/upload/v1702326644/lrpEvents/rqwsrr29nwiobfnw3y9m.png"
          },
        contactAddress: 'enquiries@twisted-tales.org.uk',
        paypalAddress: 'enquiries@twisted-tales.org.uk'
    }).save();
    await new eventHost({
        eventSystem: eldritchDays._id,
        name: 'Eldritch Days',
        display: false,
        contactAddress: '',
        paypalAddress: ''
    }).save();
    for (host of lorienTrustHosts) {
        host.eventSystem = lorienTrust._id;
        await new eventHost(host).save();
    }
    for (host of jadeThroneHosts) {
        host.eventSystem = jadeThrone._id;
        await new eventHost(host).save();
  }
  for (f of faq) {
    await new FAQ(f).save();
  }
  for (lrpEvent of sampleEvents) {
    await new LrpEvent(lrpEvent).save();
  }
};

seedDB().then(() => {
    mongoose.connection.close();
})