const mssql = require('mssql');
const EventBooking = require('../models/eventBooking');
const datesBetween = require('dates-between');

module.exports = async function importEventBookings() {
    const eventBookings = await EventBooking.find();
    console.log('Importing event bookings');
    let counter = 0;
    if (eventBookings) {
        for (eventBooking of eventBookings) {
            try {
                const userId = eventBooking.user ? await mssql.query`SELECT id FROM users WHERE legacyId=${eventBooking.user}` : null;
                const originalUserId = eventBooking.originalUser ? await mssql.query`SELECT id FROM users WHERE legacyId=${eventBooking.originalUser}` : null;
                const eventId = await mssql.query`SELECT id,name,eventStart,eventEnd FROM events WHERE legacyId=${eventBooking.event}`;
                const eventBookingRequest = new mssql.Request()
                    .input('legacyId', mssql.VarChar, eventBooking._id)
                    .input('userId', mssql.Int, userId?.recordset?.length > 0 ? userId.recordset[0].id : null)
                    .input('eventId', mssql.Int, eventId.recordset[0]?.id ?? null)
                    .input('bookingMade', mssql.DateTime, eventBooking.bookingMade)
                    .input('bookingPaid', mssql.DateTime, eventBooking.bookingPaid)
                    .input('paid', mssql.Bit, eventBooking.paid ? 1 : 0)
                    .input('payOnGate', mssql.Bit, eventBooking.payOnGate ? 1 : 0)
                    .input('inQueue', mssql.Bit, eventBooking.inQueue ? 1 : 0)
                    .input('totalDue', mssql.Numeric, eventBooking.totalDue)
                    .input('totalPaid', mssql.Numeric, eventBooking.totalPaid)
                    .input('paypalOrderId', mssql.VarChar, eventBooking.paypalOrderId)
                    .input('paypalPaymentId', mssql.VarChar, eventBooking.paypalPaymentId)
                    .input('paypalReferenceId', mssql.VarChar, eventBooking.paypalReferenceId)
                    .input('paypalPayer', mssql.VarChar, eventBooking.paypalPayer)
                    .input('displayBooking', mssql.Bit, eventBooking.displayBooking ? 1 : 0)
                    .input('firstname', mssql.VarChar, eventBooking.firstname)
                    .input('surname', mssql.VarChar, eventBooking.surname)
                    .input('originalUserId', mssql.Int, eventBooking.originalUser ? (originalUserId?.recordset.length > 0 ? originalUserId.recordset[0].id : null) : null);
                const eventBookingResult = await eventBookingRequest.query`INSERT INTO event_bookings (legacyId,[userId],eventId,bookingMade,bookingPaid,paid,payOnGate,inQueue,totalDue,totalPaid,paypalOrderId,paypalPaymentId,paypalReferenceId,paypalPayer,displayBooking,firstname,surname,originalUserId) OUTPUT INSERTED.Id VALUES (@legacyId,@userId,@eventId,@bookingMade,@bookingPaid,@paid,@payOnGate,@inQueue,@totalDue,@totalPaid,@paypalOrderId,@paypalPaymentId,@paypalReferenceId,@paypalPayer,@displayBooking,@firstname,@surname,@originalUserId)`;

                console.log(`   Inserted event booking for ${eventId.recordset[0].name} - ${eventBooking.firstname} ${eventBooking.surname}`);
                const eventBookingId = eventBookingResult.recordset[0].Id;

                const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const dateArray = datesBetween(new Date(eventId.recordset[0].eventStart), new Date(eventId.recordset[0].eventEnd));
                const dayArray = [];
                for (eventDate of dateArray) {
                    dayArray.push({
                        date: eventDate,
                        dayName: dayNames[new Date(eventDate).getDay()]
                    })
                }

                if (eventBooking.cateringChoices.length > 0) {
                    eventBooking.cateringChoices.forEach(async cateringChoice => {
                        const day = dayArray.find(x => x.dayName == cateringChoice.day);
                        const mealId = await mssql.query`SELECT [ecmo].[id],[option],[ecm].[id] AS [mealId] FROM [dbo].[events_catering_meals_options] ecmo INNER JOIN [dbo].[events_catering_meals] ecm ON ecm.id = ecmo.mealId WHERE [ecm].[date]=${day.date} AND [ecm].[name]=${cateringChoice.meal} AND [ecmo].[option]=${cateringChoice.choice}`;

                        const eventCateringRequest = new mssql.Request()
                            .input('eventBookingId', mssql.Int, eventBookingId)
                            .input('option', mssql.Int, mealId.recordset[0].id);
                        const eventCateringResult = eventCateringRequest.query`INSERT INTO event_booking_catering (eventBookingId,[optionId]) VALUES (@eventBookingId,@option)`;
                    })
                    console.log(`       Inserted catering choices for ${eventId.recordset[0].name} - ${eventBooking.firstname} ${eventBooking.surname}`);
                }
                eventBooking.eventTickets.forEach(async eventTicket => {
                    const eventTicketId = await mssql.query`SELECT id FROM event_tickets WHERE legacyId=${eventTicket._id}`
                    const eventTicketRequest = new mssql.Request()
                        .input('eventBookingId', mssql.Int, eventBookingId)
                        .input('eventTicketId', mssql.Int, eventTicketId.recordset[0].id);
                    const eventTicketResult = eventTicketRequest.query`INSERT INTO event_booking_tickets (eventBookingId,eventTicketId) VALUES (@eventBookingId,@eventTicketId)`;
                })
                console.log(`   Inserted event tickets for ${eventId.recordset[0].name} - ${eventBooking.firstname} ${eventBooking.surname}`);
            }
            catch (error) {
                if (error.message.includes('duplicate key')) {
                    console.log(`   ${eventBooking._id} already exists`);
                }
                else 
                console.log(error.message)  
            }  
            counter++;
        }
        console.log(`Inserted ${counter} of ${eventBookings.length} event bookings`);
    }
}