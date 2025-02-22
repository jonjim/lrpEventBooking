const mssql = require('mssql');
const Event = require('../models/lrpEvent');
const EventTicket = require('../models/eventTicket')
const { insertImage } = require('./utils.js');
//const { dateOutput, timeOutput, currencyOutput } = require('../utils/generic');
const datesBetween = require('dates-between');

const KEBAB_REGEX = /\p{Lu}/gu;
const JON_REGEX = /[^A-Z0-9]/ig;
const kebabCase = (str, keepLeadingDash = true) => {
	const result = str.replace(KEBAB_REGEX, (match) => `-${match.toLowerCase()}`);

	if (keepLeadingDash) {
		return result;
	}

	if (result.startsWith("-")) {
		return result.slice(1);
	}
};
const kebabed = (str) => {
    return str.replace(JON_REGEX, (match) => `-${match.toLowerCase()}`);
}

module.exports = async function importEvents() {
    const events = await Event.find().populate('eventTickets');
    console.log('Importing Events');
    let counter = 0;
    if (events) {
        for (lrpEvent of events) {
            try {
                //const systemLookup = await mssql.query`SELECT id, name FROM event_systems WHERE legacyId=${event.eventSystem}`;
                const eventLookup = await mssql.query`SELECT * FROM events WHERE legacyID=${lrpEvent._id}`;
                if (eventLookup?.recordset?.length > 0) {
                    console.log(`   ${lrpEvent.name} already exists`);
                    continue;
                }
                const hostLookup = await mssql.query`SELECT id, name FROM event_hosts WHERE legacyId=${lrpEvent.eventHost}`;
                const imgInsert = lrpEvent.img?.url ? await insertImage(lrpEvent.img.url, lrpEvent.img.filename) : null;
                const ogInsert = lrpEvent.ogCard?.url ? await insertImage(lrpEvent.ogCard.url, '') : null;
                const registrationFeeRequest = new mssql.Request()
                    .input('feeValue', mssql.Numeric, lrpEvent.registrationFee.value)
                    .input('amountPaid', mssql.Numeric, lrpEvent.registrationFee.amountPaid)
                    .input('datePaid', mssql.DateTime, lrpEvent.registrationFee.datePaid)
                    .input('paypalPaymentId', mssql.VarChar, lrpEvent.registrationFee.paypalPaymentId)
                    .input('paypalPayer', mssql.VarChar, lrpEvent.registrationFee.paypalPayer);
                const registrationFeeResult = await registrationFeeRequest.query`INSERT INTO registration_fees (feeValue,amountPaid,datePaid,paypalPaymentId,paypalPayer) OUTPUT INSERTED.Id VALUES (@feeValue,@amountPaid,@datePaid,@paypalPaymentId,@paypalPayer)`
                console.log(`   ${lrpEvent.name} registration fee inserted`);

                const eventRequest = new mssql.Request()
                    .input('legacyId', mssql.VarChar, lrpEvent._id)
                    .input('name', mssql.VarChar, lrpEvent.name)
                    .input('eventLink', mssql.VarChar,Math.floor(Math.random() * (9999 - 1000) + 1000) + '-' + lrpEvent.name.toLowerCase().replace(/[^A-Z0-9]+/ig, "-"))
                    .input('created', mssql.DateTime, lrpEvent.created)
                    .input('eventStart', mssql.DateTime, lrpEvent.eventStart)
                    .input('eventEnd', mssql.DateTime, lrpEvent.eventEnd)
                    .input('visible', mssql.Bit, lrpEvent.visible ? 1 : 0)
                    .input('cancelled', mssql.Bit, lrpEvent.cancelled ? 1 : 0)
                    .input('eventHostId', mssql.Int, hostLookup.recordset[0].id)
                    .input('registrationFeeId', mssql.Int, registrationFeeResult.recordset[0].id)
                    .input('location', mssql.VarChar, lrpEvent.location)
                    .input('locationWeb', mssql.VarChar, lrpEvent.locationWeb)
                    .input('externalBooking', mssql.VarChar, lrpEvent.externalBooking)
                    .input('icInvitation', mssql.Text, lrpEvent.icInvitation)
                    .input('fullDescription', mssql.Text, lrpEvent.fullDescription)
                    .input('promoDescription', mssql.Text, lrpEvent.promoDescription)
                    .input('bunksAvailable', mssql.Bit, lrpEvent.bunksAvailable ? 1 : 0)
                    .input('allowBookings', mssql.Bit, lrpEvent.allowBookings ? 1 : 0)
                    .input('overflowQueue', mssql.Bit, lrpEvent.overflowQueue ? 1 : 0)
                    .input('bookingsOpen', mssql.Bit, lrpEvent.bookingsOpen ? 1 : 0)
                    .input('webhooksEmail', mssql.Bit, lrpEvent.webhooks.email ? 1 : 0)
                    .input('webhooksDiscord', mssql.Bit, lrpEvent.webhooks.discord ? 1 : 0)
                    .input('imgId', mssql.Int, imgInsert)
                    .input('ogCardId', mssql.Int, ogInsert);
                const eventResult = await eventRequest.query`INSERT INTO events (legacyId,name,eventLink,created,eventStart,eventEnd,visible,cancelled,eventHostId,registrationFeeId,location,locationWeb,externalBooking,icInvitation,fullDescription,promoDescription,bunksAvailable,allowBookings,overflowQueue,bookingsOpen,webhooksEmail,webhooksDiscord,imgId,ogCardId) OUTPUT INSERTED.Id VALUES (@legacyId,@name,@eventLink,@created,@eventStart,@eventEnd,@visible,@cancelled,@eventHostId,@registrationFeeId,@location,@locationWeb,@externalBooking,@icInvitation,@fullDescription,@promoDescription,@bunksAvailable,@allowBookings,@overflowQueue,@bookingsOpen,@webhooksEmail,@webhooksDiscord,@imgId,@ogCardId)`
                console.log(`   ${lrpEvent.name} inserted`);
                
                try {
                    const eventLimitsRequest = new mssql.Request()
                        .input('eventId', mssql.Int, eventResult.recordset[0].Id)
                        .input('playerLimit', mssql.Int, lrpEvent.limits.playerLimit)
                        .input('playerBunkLimit', mssql.Int, lrpEvent.limits.playerBunkLimit)
                        .input('monsterLimit', mssql.Int, lrpEvent.limits.monsterLimit)
                        .input('monsterBunkLimit', mssql.Int, lrpEvent.limits.monsterBunkLimit)
                        .input('staffLimit', mssql.Int, lrpEvent.limits.staffLimit)
                        .input('staffBunkLimit', mssql.Int, lrpEvent.limits.staffBunkLimit)
                    const eventLimitsResult = await eventLimitsRequest.query`INSERT INTO events_limits (eventId,playerLimit,playerbunkLimit,monsterLimit,monsterBunkLimit,staffLimit,staffBunkLimit) OUTPUT INSERTED.Id VALUES (@eventId,@playerLimit,@playerbunkLimit,@monsterLimit,@monsterBunkLimit,@staffLimit,@staffBunkLimit)`
                    console.log(`   ${lrpEvent.name} limits inserted`)
                }
                catch (error) {
                    if (error.message.includes('duplicate key')) {
                        console.log(`   ${lrpEvent.name} limits already exists`);
                    }
                    else 
                    console.log(error.message)    
                }

                try {
                    const eventFinancialsRequest = new mssql.Request()
                        .input('eventId', mssql.Int, eventResult.recordset[0].Id)
                        .input('siteFee', mssql.Numeric, lrpEvent.financials.siteFee)
                        .input('insurance', mssql.Numeric, lrpEvent.financials.insurance)
                        .input('sanctioningFee', mssql.Numeric, lrpEvent.financials.sanctioningFee)
                        .input('props', mssql.Numeric, lrpEvent.financials.props)
                        .input('admin', mssql.Numeric, lrpEvent.financials.admin)
                        .input('otherCosts', mssql.Numeric, lrpEvent.financials.otherCosts)
                    const eventFinancialsResult = await eventFinancialsRequest.query`INSERT INTO events_financials (eventId,siteFee,insurance,sanctioningFee,props,admin,otherCosts) OUTPUT INSERTED.Id VALUES (@eventId,@siteFee,@insurance,@sanctioningFee,@props,@admin,@otherCosts)`
                    console.log(`   ${lrpEvent.name} financials inserted`)
                }
                catch (error) {
                    if (error.message.includes('duplicate key')) {
                        console.log(`   ${lrpEvent.name} financials already exists`)
                    }
                    else 
                    console.log(error.message)
                }
                
                console.log('   Parsing event tickets for ' + lrpEvent.name);
                for (eventTicket of lrpEvent.eventTickets) {
                    try {
                        const eventTicketsRequest = new mssql.Request()
                            .input('legacyId', mssql.VarChar, eventTicket._id)
                            .input('eventId', mssql.Int, eventResult.recordset[0].Id)
                            .input('ticketType', mssql.VarChar, eventTicket.ticketType)
                            .input('description', mssql.Text, eventTicket.description)
                            .input('availableFrom', mssql.DateTime, eventTicket.availableFrom)
                            .input('availableTo', mssql.DateTime, eventTicket.availableTo)
                            .input('cost', mssql.Numeric, eventTicket.cost)
                            .input('caterer', mssql.VarChar, eventTicket.cater)
                            .input('available', mssql.Bit, eventTicket.available ? 1 : 0);
                        const eventTicketResult = await eventTicketsRequest.query`INSERT INTO event_tickets (legacyId,eventId,ticketType,description,availableFrom,availableTo,cost,caterer,available) OUTPUT INSERTED.Id VALUES (@legacyId,@eventId,@ticketType,@description,@availableFrom,@availableTo,@cost,@caterer,@available)`
                        console.log(`   Added ticket: ${eventTicket.description}`)
                    }
                    catch (error) {
                        if (error.message.includes('duplicate key')) {
                            console.log(`   ${eventTicket.description} already exists`);
                        }
                        else {
                            console.log('Event ticket error: ', error.message)
                            console.log(eventTicket)
                            throw error;
                        }
                    }
                }
                console.log('   Parsing catering options for ' + lrpEvent.name);
                try {
                    const eventCateringRequest = new mssql.Request()
                        .input('eventId', mssql.Int, eventResult.recordset[0].Id)
                        .input('display', mssql.Bit, lrpEvent.catering.display ? 1 : 0)
                        .input('caterer', mssql.VarChar, lrpEvent.catering.caterer)
                        .input('catererContact', mssql.VarChar, lrpEvent.catering.catererContact)
                        .input('notes', mssql.Text, lrpEvent.catering.notes)
                        .input('choiceRequired', mssql.Bit, lrpEvent.catering.choiceRequired ? 1 : 0)
                        .input('cost', mssql.Numeric, lrpEvent.catering.cost)
                        .input('bookingsClose', mssql.DateTime, lrpEvent.catering.bookingsClose)
                    const eventCateringResult = await eventCateringRequest.query`INSERT INTO events_catering (eventId,display,caterer,catererContact,notes,choiceRequired,cost,bookingsClose) OUTPUT INSERTED.Id VALUES (@eventId,@display,@caterer,@catererContact,@notes,@choiceRequired,@cost,@bookingsClose)`

                    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                    const dateArray = datesBetween(new Date(lrpEvent.eventStart), new Date(lrpEvent.eventEnd));
                    const dayArray = [];
                    for (eventDate of dateArray) {
                        dayArray.push({
                            date: eventDate,
                            dayName: dayNames[new Date(eventDate).getDay()]
                        })
                    }

                    const eventCatering = JSON.parse(JSON.stringify(lrpEvent.catering))
                    if (eventCatering.menu) {
                        for (eventMenu of dayArray) {
                            try {
                                const keys = Object.keys(eventCatering.menu[eventMenu.dayName]?.meals)
                                for (meal of keys) {
                                    try {
                                        const eventCateringMenuRequest = new mssql.Request()
                                            .input('eventCateringId', mssql.Int, eventCateringResult.recordset[0].Id)
                                            .input('name', mssql.VarChar, eventCatering.menu[eventMenu.dayName].meals[meal].name)
                                            .input('date', mssql.DateTime, new Date(eventMenu.date));
                                        const eventCateringMenuResponse = await eventCateringMenuRequest.query`INSERT INTO events_catering_meals (eventsCateringId,name,date) OUTPUT INSERTED.Id VALUES (@eventCateringId,@name,@date)`

                                        for (mealOption of eventCatering.menu[eventMenu.dayName].meals[meal].options) {
                                            const eventCateringMenuOptionRequest = new mssql.Request()
                                                .input('meal', mssql.Int, eventCateringMenuResponse.recordset[0].Id)
                                                .input('option', mssql.VarChar, mealOption);
                                            const eventCateringMenuOptionResponse = await eventCateringMenuOptionRequest.query`INSERT INTO events_catering_meals_options (mealId,[option]) OUTPUT INSERTED.Id VALUES (@meal,@option)`
                                        }
                                    }
                                    catch (error) {
                                        if (error.message.includes('duplicate key')) {
                                            console.log(`   ${lrpEvent.name} catering already exists`);
                                        }
                                        else
                                            console.log(error.message)
                                    }
                                }
                            }
                            catch (error) {
                                if (error.message.includes('duplicate key')) {
                                    console.log(`   ${lrpEvent.name} catering already exists`);
                                }
                                else
                                    console.log(error.message)
                            }
                        }
                        console.log(`   ${lrpEvent.name} catering inserted`);
                    }
                }
                catch (error) {
                    if (error.message.includes('duplicate key')) {
                        console.log(`   ${lrpEvent.name} catering already exists`);
                    }
                    else 
                    console.log(error.message)  
                }

                if (lrpEvent.returnPack != undefined) {
                    try {
                        const eventReturnPackRequest = new mssql.Request()
                            .input('eventId', mssql.Int, eventResult.recordset[0].Id)
                            .input('arrivalTimeIn', mssql.DateTime, lrpEvent.returnPack.timeInOut?.arrivalTimeIn)
                            .input('dailyTimeIn', mssql.DateTime, lrpEvent.returnPack.timeInOut?.dailyTimeIn)
                            .input('dailyTimeOut', mssql.DateTime, lrpEvent.returnPack.timeInOut?.dailyTimeOut)
                            .input('departureTimeOut', mssql.DateTime, lrpEvent.returnPack.timeInOut?.departureTimeOut)
                            .input('timeInOutNotes', mssql.Text, lrpEvent.returnPack.timeInOut?.notes)
                            .input('arrivalTime', mssql.DateTime, lrpEvent.returnPack.arrivalDeparture?.arrivalTime)
                            .input('departureTime', mssql.DateTime, lrpEvent.returnPack.arrivalDeparture?.departureTime)
                            .input('arrivalDepartureNotes', mssql.Text, lrpEvent.returnPack.arrivalDeparture?.notes)
                            .input('gamesOperations', mssql.VarChar, lrpEvent.returnPack?.eventStaff?.gamesOperations)
                            .input('plotActuation', mssql.VarChar, lrpEvent.returnPack?.eventStaff?.plotActuation)
                            .input('firstAid', mssql.VarChar, lrpEvent.returnPack?.eventStaff?.firstAid)
                            .input('referees', mssql.VarChar, lrpEvent.returnPack?.eventStaff?.referees)
                            .input('otherStaff', mssql.VarChar, lrpEvent.returnPack.eventStaff?.otherStaff?.join(','))
                            .input('parking', mssql.Text, lrpEvent.returnPack?.parking)
                            .input('camping', mssql.Text, lrpEvent.returnPack?.camping)
                            .input('bunks', mssql.Text, lrpEvent.returnPack?.bunks)
                            .input('otherNotes', mssql.Text, lrpEvent.returnPack?.otherNotes)
                        const eventReturnPackResult = await eventReturnPackRequest.query`INSERT INTO events_return_pack (eventId,arrivalTimeIn,dailyTimeIn,dailyTimeOut,departureTimeOut,timeInOutNotes,arrivalTime,departureTime,arrivalDepartureNotes,gamesOperations,plotActuation,firstAid,referees,otherStaff,parking,camping,bunks,otherNotes) OUTPUT INSERTED.Id VALUES (@eventId,@arrivalTimeIn,@dailyTimeIn,@dailyTimeOut,@departureTimeOut,@timeInOutNotes,@arrivalTime,@departureTime,@arrivalDepartureNotes,@gamesOperations,@plotActuation,@firstAid,@referees,@otherStaff,@parking,@camping,@bunks,@otherNotes)`
                        console.log(`   ${lrpEvent.name} return pack inserted`)
                    }
                    catch (error) {
                        if (error.message.includes('duplicate key')) {
                            console.log(`   ${lrpEvent.name} return pack already exists`);
                        }
                        else
                            console.log('return pack error ' + error.message)
                    }
                }
                counter++;
            }
            catch (error) {
                console.log(error.message)
            }
        }
        console.log(`Inserted ${counter} of ${events.length} events`);
    }
}