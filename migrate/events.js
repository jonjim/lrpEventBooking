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
    const paymentIdRef = await mssql.query`SELECT PaymentProviderFieldID FROM [Payments].[Ref_Payment_Provider_Fields] WHERE [Name]='Payment ID'`
    const events = await Event.find().populate('eventTickets').populate('eventHost');
    console.log('Importing Events');
    let counter = 0;
    if (events) {
        for (lrpEvent of events) {
            try {
                const eventName = lrpEvent.name.toLowerCase().replace(/[^A-Z0-9]+/ig, "-");
                //const systemLookup = await mssql.query`SELECT id, name FROM event_systems WHERE legacyId=${event.eventSystem}`;
                const eventLookup = await mssql.query`SELECT * FROM [Events].[Dat_Events] WHERE EventLink='${eventName}'`;
                if (eventLookup?.recordset?.length > 0) {
                    console.log(`   ${lrpEvent.name} already exists`);
                    continue;
                }
                const imgInsert = lrpEvent.img?.url ? await insertImage(lrpEvent.img.url, lrpEvent.img.filename) : null;
                const ogInsert = lrpEvent.ogCard?.url ? await insertImage(lrpEvent.ogCard.url, '') : null;
                const registrationFeeRequest = new mssql.Request()
                    .input('feeValue', mssql.Numeric(18,2), lrpEvent.registrationFee.value)
                    .input('amountPaid', mssql.Numeric(18,2), lrpEvent.registrationFee.amountPaid)
                    .input('datePaid', mssql.DateTime, lrpEvent.registrationFee.datePaid)
                    .input('paypalPaymentId', mssql.VarChar, lrpEvent.registrationFee.paypalPaymentId)
                    .input('paypalPayer', mssql.VarChar, lrpEvent.registrationFee.paypalPayer)
                    .input('paymentProviderFieldID', mssql.Int, paymentIdRef.recordset[0].PaymentProviderFieldID);
                const registrationFeeResult = await registrationFeeRequest.query`INSERT INTO [Events].[Dat_Registration_Fees] (feeValue,amountPaid,datePaid) OUTPUT INSERTED.RegistrationFeeID VALUES (@feeValue,@amountPaid,@datePaid)`
                console.log(`   ${lrpEvent.name} registration fee inserted`);
                if (lrpEvent.registrationFee.paypalPaymentId){
                    const paymentId = await registrationFeeRequest.query`INSERT INTO [Payments].[Dat_Payments] (Value,Date,Payee) OUTPUT INSERTED.PaymentID VALUES (@amountPaid,@datePaid,@paypalPayer)`;
                    await registrationFeeRequest.query`INSERT INTO [Payments].[Lnk_Payment_Data] ([PaymentID],[PaymentProviderFieldID],[Value]) VALUES (${paymentId.recordset[0].PaymentID},@paymentProviderFieldID,@paypalPaymentId)`
                    console.log(`       Inserted payment: ${lrpEvent.registrationFee.paypalPaymentId}`)
                }

                const eventRequest = new mssql.Request()
                    .input('HostName', mssql.VarChar, lrpEvent.eventHost.name)
                    .input('ImageID', mssql.Int, imgInsert)
                    .input('OGCardId', mssql.Int, ogInsert)
                    .input('RegistrationFeeId', mssql.Int, registrationFeeResult.recordset[0].id)
                    .input('EventLink', mssql.VarChar,Math.floor(Math.random() * (9999 - 1000) + 1000) + '-' + eventName)
                    .input('Name', mssql.VarChar, lrpEvent.name)
                    .input('Created', mssql.DateTime, lrpEvent.created)
                    .input('EventStart', mssql.DateTime, lrpEvent.eventStart)
                    .input('EventEnd', mssql.DateTime, lrpEvent.eventEnd)
                    .input('Visible', mssql.Bit, lrpEvent.visible ? 1 : 0)
                    .input('Cancelled', mssql.Bit, lrpEvent.cancelled ? 1 : 0)
                    .input('Location', mssql.VarChar, lrpEvent.location)
                    .input('LocationWeb', mssql.VarChar, lrpEvent.locationWeb)
                    .input('ExternalBooking', mssql.VarChar, lrpEvent.externalBooking)
                    .input('IcInvitation', mssql.Text, lrpEvent.icInvitation)
                    .input('FullDescription', mssql.Text, lrpEvent.fullDescription)
                    .input('PromoDescription', mssql.Text, lrpEvent.promoDescription)
                    .input('BunksAvailable', mssql.Bit, lrpEvent.bunksAvailable ? 1 : 0)
                    .input('AllowBookings', mssql.Bit, lrpEvent.allowBookings ? 1 : 0)
                    .input('OverflowQueue', mssql.Bit, lrpEvent.overflowQueue ? 1 : 0)
                    .input('BookingsOpen', mssql.Bit, lrpEvent.bookingsOpen ? 1 : 0)
                    .input('WebhooksEmail', mssql.Bit, lrpEvent.webhooks.email ? 1 : 0)
                    .input('WebhooksDiscord', mssql.Bit, lrpEvent.webhooks.discord ? 1 : 0)
                    
                const eventResult = await eventRequest.query`INSERT INTO [Events].[Dat_Events] ([SystemID],[HostID],[ImageID],[OGCardID],[RegistrationFeeID],[EventLink],[Name],[Created],[EventStart],[EventEnd],[Visible],[Cancelled],[Location],[LocationWeb],[ExternalBooking],[IcInvitation],[FullDescription],[PromoDescription],[BunksAvailable],[AllowBookings],[OverflowQueue],[BookingsOpen],[WebhooksEmail],[WebhooksDiscord])
                OUTPUT INSERTED.EventID 
                SELECT SDS.[SystemID], SDH.[HostID], @ImageID, @OGCardID, @RegistrationFeeID, @EventLink, @Name, @Created, @EventStart, @EventEnd, @Visible, @Cancelled, @Location, @LocationWeb, @ExternalBooking, @IcInvitation, @FullDescription, @PromoDescription, @BunksAvailable, @AllowBookings, @OverflowQueue, @BookingsOpen, @WebhooksEmail, @WebhooksDiscord
                FROM [Systems].[Dat_Hosts] SDH
                    LEFT JOIN [Systems].[Dat_Systems] SDS ON SDH.[SystemID] = SDS.[SystemID]
                WHERE SDH.[Name] = @HostName`
                console.log(`   ${lrpEvent.name} inserted`);
                
                // try {
                //     const eventLimitsRequest = new mssql.Request()
                //         .input('eventId', mssql.Int, eventResult.recordset[0].Id)
                //         .input('playerLimit', mssql.Int, lrpEvent.limits.playerLimit)
                //         .input('playerBunkLimit', mssql.Int, lrpEvent.limits.playerBunkLimit)
                //         .input('monsterLimit', mssql.Int, lrpEvent.limits.monsterLimit)
                //         .input('monsterBunkLimit', mssql.Int, lrpEvent.limits.monsterBunkLimit)
                //         .input('staffLimit', mssql.Int, lrpEvent.limits.staffLimit)
                //         .input('staffBunkLimit', mssql.Int, lrpEvent.limits.staffBunkLimit)
                //     const eventLimitsResult = await eventLimitsRequest.query`INSERT INTO events_limits (eventId,playerLimit,playerbunkLimit,monsterLimit,monsterBunkLimit,staffLimit,staffBunkLimit) OUTPUT INSERTED.Id VALUES (@eventId,@playerLimit,@playerbunkLimit,@monsterLimit,@monsterBunkLimit,@staffLimit,@staffBunkLimit)`
                //     console.log(`   ${lrpEvent.name} limits inserted`)
                // }
                // catch (error) {
                //     if (error.message.includes('duplicate key')) {
                //         console.log(`   ${lrpEvent.name} limits already exists`);
                //     }
                //     else 
                //     console.log(error.message)    
                // }

                try {
                    const eventFinancialsRequest = new mssql.Request()
                        .input('eventId', mssql.Int, eventResult.recordset[0].EventID)
                        .input('siteFee', mssql.Numeric(18,2), lrpEvent.financials.siteFee)
                        .input('insurance', mssql.Numeric(18,2), lrpEvent.financials.insurance)
                        .input('sanctioningFee', mssql.Numeric(18,2), lrpEvent.financials.sanctioningFee)
                        .input('props', mssql.Numeric(18,2), lrpEvent.financials.props)
                        .input('admin', mssql.Numeric(18,2), lrpEvent.financials.admin)
                        .input('otherCosts', mssql.Numeric(18,2), lrpEvent.financials.otherCosts)
                    const eventFinancialsResult = await eventFinancialsRequest.query`INSERT INTO [Events].[Dat_Financials] (EventID,SiteFee,Insurance,SanctioningFee,Props,Admin,OtherCosts) VALUES (@eventId,@siteFee,@insurance,@sanctioningFee,@props,@admin,@otherCosts)`
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
                        let ticketType;
                        let ticketLimit;
                        switch (eventTicket.ticketType){
                            case 'player':
                                ticketType = 'Player';
                                ticketLimit = lrpEvent.limits.playerLimit;
                                break;
                            case 'playerChild':
                                ticketType = 'Player (Under 16)';
                                ticketLimit = lrpEvent.limits.playerLimit;
                                break;
                            case 'monster':
                                ticketType = 'Crew';
                                ticketLimit = lrpEvent.limits.monsterLimit;
                                break;
                            case 'monsterChild':
                                ticketType = 'Crew (Under 16)';
                                ticketLimit = lrpEvent.limits.monsterLimit;
                                break;
                            case 'staff':
                                ticketType = 'Staff';
                                ticketLimit = lrpEvent.limits.staffLimit;
                                break;
                            case 'playerBunk':
                            case 'monsterBunk':
                            case 'staffBunk':
                                ticketType = 'Bunk';
                                ticketLimit = lrpEvent.limits.monsterBunkLimit;
                                break;
                            case 'mealTicket':
                                ticketType = 'Meal';
                                ticketLimit = null;
                                break;
                            case 'mealTicketChild':
                                ticketType = 'Meal (Under 16)';
                                ticketLimit = null;
                                break;
                        }
                        const eventTicketsRequest = new mssql.Request()
                            .input('EventID', mssql.Int, eventResult.recordset[0].EventID)
                            .input('TicketType', mssql.VarChar, ticketType)
                            .input('Description', mssql.Text, eventTicket.description)
                            .input('AvailableFrom', mssql.DateTime, eventTicket.availableFrom)
                            .input('AvailableTo', mssql.DateTime, eventTicket.availableTo)
                            .input('Cost', mssql.Numeric(18,2), eventTicket.cost)
                            .input('Caterer', mssql.VarChar, eventTicket.cater)
                            .input('Available', mssql.Bit, eventTicket.available ? 1 : 0)
                            .input('TicketLimit', mssql.Int, ticketLimit);
                        const eventTicketResult = await eventTicketsRequest.query`INSERT INTO [Events].[Dat_Tickets] ([EventID],[TicketTypeID],[Name],[Description],[Restrictions],[AvailableFrom],[AvailableTo],[Cost],[Caterer],[Available])
                        OUTPUT INSERTED.TicketID
                        SELECT @EventID, CRTT.TicketTypeID, CRTT.[Name], @Description, null, @AvailableFrom, @AvailableTo, @Cost, @Caterer, @Available
                        FROM [Config].[Ref_Ticket_Types] CRTT
                        WHERE CRTT.[Name] = @TicketType;
                        
                        IF @TicketLimit IS NOT NULL
                        INSERT INTO [Events].[Dat_Ticket_Limits] (TicketID,[Value])
                        VALUES (@@IDENTITY,@ticketLimit)`;
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
                        .input('eventId', mssql.Int, eventResult.recordset[0].EventID)
                        .input('display', mssql.Bit, lrpEvent.catering.display ? 1 : 0)
                        .input('caterer', mssql.VarChar, lrpEvent.catering.caterer)
                        .input('catererContact', mssql.VarChar, lrpEvent.catering.catererContact)
                        .input('notes', mssql.Text, lrpEvent.catering.notes)
                        .input('choiceRequired', mssql.Bit, lrpEvent.catering.choiceRequired ? 1 : 0)
                        .input('cost', mssql.Numeric(18,2), lrpEvent.catering.cost)
                        .input('bookingsClose', mssql.DateTime, lrpEvent.catering.bookingsClose)
                    const eventCateringResult = await eventCateringRequest.query`INSERT INTO [Events].[Dat_Catering] (eventId,display,caterer,catererContact,notes,choiceRequired,cost,bookingsClose) OUTPUT INSERTED.CateringID VALUES (@eventId,@display,@caterer,@catererContact,@notes,@choiceRequired,@cost,@bookingsClose)`

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
                                            .input('eventCateringId', mssql.Int, eventCateringResult.recordset[0].CateringID)
                                            .input('name', mssql.VarChar, eventCatering.menu[eventMenu.dayName].meals[meal].name)
                                            .input('date', mssql.DateTime, new Date(eventMenu.date));
                                        const eventCateringMenuResponse = await eventCateringMenuRequest.query`INSERT INTO [Events].[Dat_Catering_Meals] (CateringID,name,date) OUTPUT INSERTED.MealID VALUES (@eventCateringId,@name,@date)`

                                        for (mealOption of eventCatering.menu[eventMenu.dayName].meals[meal].options) {
                                            const eventCateringMenuOptionRequest = new mssql.Request()
                                                .input('cateringId', mssql.Int, eventCateringResult.recordset[0].CateringID)
                                                .input('meal', mssql.Int, eventCateringMenuResponse.recordset[0].MealID)
                                                .input('option', mssql.VarChar, mealOption);
                                            const eventCateringMenuOptionResponse = await eventCateringMenuOptionRequest.query`INSERT INTO [Events].[Dat_Catering_Options] (CateringID,MealID,[option]) OUTPUT INSERTED.OptionID VALUES (@cateringId,@meal,@option)`
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
                        const eventReturnPackResult = await eventReturnPackRequest.query`INSERT INTO [Events].[Dat_Return_Pack] (eventId,arrivalTimeIn,dailyTimeIn,dailyTimeOut,departureTimeOut,timeInOutNotes,arrivalTime,departureTime,arrivalDepartureNotes,gamesOperations,plotActuation,firstAid,referees,otherStaff,parking,camping,bunks,otherNotes) OUTPUT INSERTED.ReturnPackID VALUES (@eventId,@arrivalTimeIn,@dailyTimeIn,@dailyTimeOut,@departureTimeOut,@timeInOutNotes,@arrivalTime,@departureTime,@arrivalDepartureNotes,@gamesOperations,@plotActuation,@firstAid,@referees,@otherStaff,@parking,@camping,@bunks,@otherNotes)`
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