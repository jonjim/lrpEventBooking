if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.log('Error connection to MongoDB');
        console.log(err);
    });

// Models
const eventHost = require('../models/eventHost');
const siteConfig = require('../models/siteConfig');
const EventSystems = require('../models/eventSystems');
const FAQ = require('../models/faq')
const LrpEvent = require('../models/lrpEvent');

// JSON Imports
const faq = require('./faq.json');


// Seed demo data

const seedDb = async() => {
   const findConfig = await siteConfig.find();
    if (findConfig.length === 0) {
        await new siteConfig({
            privacyPolicy: '<h2>The Type Of Personal Information We Collect</h2>\r\n<p>We collect and process the following information:</p>\r\n<ul>\r\n<li>Personal identifiers, contacts and characteristics (for example, name, date of birth, contact details, and emergency contact details)</li>\r\n<li>Confirmation of payment and the method of payment;</li>\r\n<li>Character and player details as relevant to the LARP event and LARP event system;</li>\r\n<li>Dietary requirements, including any allergy information;</li>\r\n<li>Limited medical information (as may be required in case of emergency or to ensure your safety at our events).</li>\r\n</ul>\r\n<h2>How We Get The Personal Information And Why We Collect It</h2>\r\n<p>All the information we process is provided to us directly by you as part of the event booking process.</p>\r\n<p>Your personally identifiable data is used for the management of events including; compliance with our insurance requirements, compliance with the rules of the relevant LRP system and to ensure your safety while attending our events.</p>\r\n<p>We may share the following information as required:</p>\r\n<ul>\r\n<li>Dietary requirements will be shared with the chosen catering organisation for an event to allow your dietary requirements to be catered for;</li>\r\n<li>Medical information will be shared with the event First Aid Team to allow them to respond appropriately in an emergency;</li>\r\n<li>Player and/or Character details will be shared with an Event System upon booking a relevant event;</li>\r\n</ul>\r\n<p>Under the UK General Data Protection Regulation (GDPR), the lawful bases we rely on for processing this information are:</p>\r\n<ul>\r\n<li>(a) The performance of our contractual obligation with you (e.g. to manage your booking and our events);</li>\r\n<li>(b) Your consent (e.g. retaining your booking information and contact details between events). Where data is processed relying on your consent, you are able to withdraw that consent at any time by contacting&nbsp;<a href=\"mailto:enquiries@twisted-tales.org.uk\">enquiries@twisted-tales.org.uk</a>;</li>\r\n<li>(c) We have a legal obligation.</li>\r\n</ul>\r\n<h2>How We Store Your Personal Information</h2>\r\n<p>Your information is securely stored in an encrypted database format using Microsoft Azure services. All information is held within the UK.</p>\r\n<p>Immediately prior to and during the running of a LARP event, your information is kept by the logistics coordinator for the event in a physical paper copy.</p>\r\n<p>All data provided for the purposes of managing an event will be securely stored until 30 days after the event, or the conclusion of any on-going disputes that may require access to your data (for example, insurance information following an injury). At the end of this period all physical copies of the data will be destroyed will be deleted. Digital data will continue to be stored, but will no longer be accessible by the event organiser.</p>\r\n<h2>Your Data Protection Rights</h2>\r\n<p>Under data protection law, you have rights including:</p>\r\n<h3>Your Right Of Access</h3>\r\n<p>You have the right to ask us for copies of your personal information.</p>\r\n<h3>Your Right To Rectification</h3>\r\n<p>You have the right to ask us to rectify personal information you think is inaccurate. You also have the right to ask us to complete information you think is incomplete.</p>\r\n<h3>Your Right To Erasure</h3>\r\n<p>You have the right to ask us to erase your personal information in certain circumstances.</p>\r\n<h3>Your Right To Restriction Of Processing</h3>\r\n<p>You have the right to ask us to restrict the processing of your personal information in certain circumstances.</p>\r\n<h3>Your Right To Object To Processing</h3>\r\n<p>You have the right to object to the processing of your personal information in certain circumstances.</p>\r\n<h3>Your Right To Data Portability</h3>\r\n<p>You have the right to ask that we transfer the personal information you gave us to another organisation, or to you, in certain circumstances.</p>\r\n<p>You are not required to pay any charge for exercising your rights. If you make a request, we have one month to respond to you.</p>\r\n<p>Please contact us at&nbsp;<a href=\"mailto:enquiries@twisted-tales.org.uk\">enquiries@twisted-tales.org.uk</a>&nbsp;if you wish to make a request.</p>\r\n<h2>How To Complain</h2>\r\n<p>If you have any concerns about our use of your personal information, you can make a complaint to us at&nbsp;<a href=\"mailto:enquiries@twisted-tales.org.uk\">enquiries@twisted-tales.org.uk</a>.</p>\r\n<p>You can also complain to the ICO if you are unhappy with how we have used your data.</p>\r\n<p>The ICO&rsquo;s address:<br>Information Commissioner&rsquo;s Office<br>Wycliffe House<br>Water Lane<br>Wilmslow<br>Cheshire<br>SK9 5AF</p>\r\n<p>Helpline number:&nbsp;0303 123 1113<br>ICO website: https://www.ico.org.uk</p>',
            terms: '<h2 >Use of this website</h2>\r\n<p >By using this website you acknowledge that your details will be stored and sued for the purposes of booking and administering events run by third party Event Organisers, in line with our Privacy Policy.</p>\r\n<p >Whilst each Event Organiser may have their own Terms &amp; Conditions, they are required to adhere to our general Terms and Conditions as well as any attendee.</p>\r\n<h2 >General Terms and Conditions</h2>\r\n<ol>\r\n<li >Neither this website nor an Event Organiser can be held personally liable for any injury or damage to any individual whilst participating in any event as permitted by law.</li>\r\n<li >Neither this website nor an Event Organiser <span style=\"font-family: Nunito; color: #212529; background: white;\">can </span>be held responsible for any damage to, loss of, or theft of any personal or communal property during any event. Lost property can be handed in or collected from Games Control at the event and will be held for 1 year following the event by the Event Organisers.</li>\r\n<li ><span style=\"mso-fareast-language: EN-GB;\">Live Action Role Play is a potentially dangerous hobby and I will act in a reasonable and safe manner during any Live Action Role Play event and follow any and all reasonable instructions provided by the Organisers.</span></li>\r\n<li ><span style=\"mso-fareast-language: EN-GB;\">I understand and agree that </span>the Event Organisers<span style=\"mso-fareast-language: EN-GB;\"> reserves the right to refuse admission or participation in any event or part of an event to any individual at any time. The </span>Event <span style=\"mso-fareast-language: EN-GB;\">Organisers are not obliged to give any reason or explanation for such a decision, but one may be supplied after following the event if requested in writing.</span></li>\r\n<li ><span style=\"mso-fareast-language: EN-GB;\">Metal weapons or tools are NOT to be brought onto site. Only L</span>ive Action <span style=\"mso-fareast-language: EN-GB;\">R</span>ole <span style=\"mso-fareast-language: EN-GB;\">P</span>lay<span style=\"mso-fareast-language: EN-GB;\"> safe weapons can be used subject to checking at Games Control. Any unsafe weapons should be returned to your vehicle or stored by Games Control.</span></li>\r\n<li ><span style=\"mso-fareast-language: EN-GB;\">Any non-combat props should be presented for a safety check on registration.</span></li>\r\n<li ><span style=\"mso-fareast-language: EN-GB;\">To comply with the Event Organisers rules as relevant to the event, the rules system in effect (for example Lorien Trust) to be made clear on the booking page.</span></li>\r\n<li ><span style=\"mso-fareast-language: EN-GB;\">No controlled substances other than legitimately prescribed drugs will be tolerated on site.</span></li>\r\n<li ><span style=\"mso-fareast-language: EN-GB;\">The Event Organisers will expel any individual engaged in illegal, defamatory, or dangerous practices during the event and the relevant authorities may be contacted. Individuals expelled from the event as a result of breach of these terms and conditions shall not be entitled to a refund.</span></li>\r\n<li ><span style=\"mso-fareast-language: EN-GB;\">Only individuals authorised by the Event Organisers may act as or hold themselves out to be (whether by act or omission) referees, marshals or directors of plot (as relevant).</span></li>\r\n<li ><span style=\"mso-fareast-language: EN-GB;\">The decision of the Event Organisers is final in all disputes.</span></li>\r\n</ol>',
            techContactName: 'Jonathan Kane',
            techContactEmail: 'jon.kane@msdl.net',
            paypalPercentage: 1.2,
            paypalFixedFee: 0.30,
            siteName: 'LARP Event Bookings',
            siteDescription: 'LARP Event Bookings - Event information and booking for LRP events across the United Kingdom'
        }).save();
    }

    const demoEventSystem = await new EventSystems({
            "img": {
                "filename": "lrpEvents/n9wzcogl0o0lco8q5v1m",
                "url": "https://res.cloudinary.com/dapc3dsxv/image/upload/v1702297296/lrpEvents/n9wzcogl0o0lco8q5v1m.png"
              },
              "customTools": [],
              "name": "Makeshift Events",
              "description": "<p>Imagine this is your event system, creating the most unique and exciting events</p>",
              "website": "https://www.lrptickets.co.uk/",
              "terms": "<h2>In Booking For A Makeshift Events LRP ('The Organisers') Event, You Acknowledge And Agree:</h2>\r\n<ul>\r\n<li>Makeshift Events LRP or any persons so appointed by Makeshift Events LRP cannot be held personally liable for any injury or damage to any individual participating in any Makeshift Events LRP event as permitted by law.</li>\r\n<li>Makeshift Events LRP cannot be held responsible for any damage to, loss of, or theft of any personal or communal property during any event. Lost property can be handed in or collected from Games Control at the event and will be held for 1 year following the event by the Organisers</li>\r\n<li>LRP is a potentially dangerous hobby and I will act in a reasonable and safe manner during any LRP event and follow any and all reasonable instructions provided by the Organisers.</li>\r\n<li>I understand and agree that Makeshift Events LRP reserves the right to refuse admission or participation in any event or part of an event to any individual at any time. The Organisers are not obliged to give any reason or explanation for such a decision, but one may be supplied after following the event if requested in writing.</li>\r\n<li>Metal weapons or tools are NOT to be brought onto site. Only LRP safe weapons can be used subject to checking at Games Control. Any unsafe weapons should be returned to your vehicle or stored by Games Control.</li>\r\n<li>Any non-combat props should be presented for a safety check on registration.</li>\r\n<li>To comply with the LRP system rules as relevant to the event, the rules system in effect (for example Lorien Trust) to be made clear on the booking page.</li>\r\n<li>No controlled substances other than legitimately prescribed drugs will be tolerated on site.</li>\r\n<li>The Organisers will expel any individual engaged in illegal, defamatory, or dangerous practices during the event and the relevant authorities may be contacted. Individuals expelled from the event as a result of breach of these terms and conditions shall not be entitled to a refund.</li>\r\n<li>Only individuals authorised by the event Organiser may act as or hold themselves out to be (whether by act or omission) referees, marshals or directors of plot (as relevant) at Makeshift Events LRP run events.</li>\r\n<li>Bookings may be cancelled within 28 days of receipt of payment, and no later than 14 days prior to the event date. Outside of this 28-day period any cancellation may be subject to a &pound;5 cancellation fee at the Organisers&rsquo; discretion. In lieu of a refund the Organisers may allow the booking to be transferred to another player, or deferred to another event run by Makeshift Events LRP.</li>\r\n<li>The decision of the Organisers is final in all disputes.</li>\r\n</ul>\r\n<h2>By Using This Website, You Acknowledge That</h2>\r\n<p>Your details will be stored and used for the purposes of booking and administering events run by Makeshift Events LRP, in line with our&nbsp;<a href=\"https://events.tarantulafaction.com/privacy.php\" target=\"_blank\" rel=\"noopener\">Privacy Policy</a></p>",
              "systemRef": "makeshiftEvents",
              "active": true,
              "customFields": []
        }).save();

        const demoEventHost = await new eventHost({
            eventSystem: demoEventSystem._id,
            name: 'Makeshift Events',
            display: false,
            img: {
                filename: "lrpEvents/rqwsrr29nwiobfnw3y9m",
                url: "https://res.cloudinary.com/dapc3dsxv/image/upload/v1702326644/lrpEvents/rqwsrr29nwiobfnw3y9m.png"
                },
            contactAddress: 'enquiries@lrptickets.co.uk',
            paypalAddress: 'enquiries@lrptickets.co.uk'
        }).save();

    for (f of faq) {
        await new FAQ(f).save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})