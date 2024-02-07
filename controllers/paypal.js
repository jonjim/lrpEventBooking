const EventBooking = require('../models/eventBooking');
const Event = require('../models/lrpEvent');
const mongoose = require('mongoose');
const base = process.env.PAYPAL_SANDBOX == 'true' ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
const paypalClientId = process.env.PAYPAL_SANDBOX == 'true' ? process.env.PAYPAL_SANDBOX_CLIENT_ID : process.env.PAYPAL_CLIENT_ID;
const paypalSecret = process.env.PAYPAL_SANDBOX == 'true' ? process.env.PAYPAL_SANDBOX_CLIENT_SECRET : process.env.PAYPAL_CLIENT_SECRET;
const emailService = require('../utils/email');
const pdfService = require('../utils/pdf');
const {attendeeUpdate} = require('../utils/systemCheck')

/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 * @see https://developer.paypal.com/api/rest/authentication/
 */
const generateAccessToken = async() => {
    try {
        if (!process.env.PAYPAL_SANDBOX == 'true')
            if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
                throw new Error("MISSING_API_CREDENTIALS");
            }
        else {
            if (!process.env.PAYPAL_SANDBOX_CLIENT_ID || !process.env.PAYPAL_SANDBOX_CLIENT_SECRET) {
                throw new Error("MISSING_API_CREDENTIALS");
            }
        }

        const auth = Buffer.from(
            paypalClientId + ":" + paypalSecret,
        ).toString("base64");
        const response = await fetch(`${base}/v1/oauth2/token`, {
            method: "POST",
            body: "grant_type=client_credentials",
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("Failed to generate Access Token:", error);
    }
};

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const createOrder = async(cart) => {
    // use the cart information passed from the front-end to calculate the purchase unit details
    // console.log(
    //   "shopping cart information passed from the frontend createOrder() callback:",
    //   cart,
    // );
    const eventBooking = await EventBooking.findById(cart[0].id).populate('eventTickets').populate('event').populate({path: 'event', populate: {path: 'eventHost'}});
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders`;
    const payload = {
        intent: "CAPTURE",
        purchase_units: [{
            reference_id: cart[0].id,
            description: `Event Booking for: ${eventBooking.event.name}`,
            amount: {
                currency_code: "GBP",
                value: (eventBooking.eventTickets.reduce((acc, a) => acc + a.cost, 0) - eventBooking.totalPaid)
            },
            payee: {
                email_address: eventBooking.event.eventHost.paypalAddress
            }
        }, ],
    };

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
            // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
            // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
        },
        method: "POST",
        body: JSON.stringify(payload),
    });

    return handleResponse(response);
};

/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async(req, orderID) => {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderID}/capture`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
            // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
            //"PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
        },
    });

    var responseData = await handleResponse(response);
    //console.log(responseData.jsonResponse);

    const errorDetail = responseData.jsonResponse?.details?.[0];

    if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
        // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
        // recoverable state, per https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
    } else if (errorDetail) {
        // (2) Other non-recoverable errors -> Show a failure message
    } else if (!responseData.jsonResponse.purchase_units) {
    } else {
        // (3) Successful transaction -> Show confirmation or thank you message
        // Or go to another URL:  actions.redirect('thank_you.html');
        var eventBooking = await EventBooking.findById(responseData.jsonResponse.purchase_units[0].reference_id).populate('eventTickets').populate('user');
        var event = await Event.findById(eventBooking.event).populate('eventHost').populate({path: 'eventHost', populate:{ path: 'eventSystem'}});
        
        eventBooking.paid = true;
        eventBooking.paypalPaymentId = responseData.jsonResponse.purchase_units[0].payments.captures[0].id;
        eventBooking.paypalOrderId = responseData.jsonResponse.id;
        eventBooking.totalPaid = eventBooking.totalDue;
        eventBooking.bookingPaid = Date.now();
        eventBooking.paypalPayer = responseData.jsonResponse.payer.email_address;
        eventBooking.payOnGate = false;
        eventBooking.firstname = req.user.firstname;
        eventBooking.surname = req.user.surname;
        eventBooking.displayBooking = req.user.displayBookings;
        await eventBooking.save();
        await Event.findByIdAndUpdate(eventBooking.event, {
            $push: {
                attendees: { ...await attendeeUpdate(event.eventHost.eventSystem,eventBooking)}
            }
        })
        req.flash('success', `Payment complete!`);
    }
    return responseData;
};

async function handleResponse(response) {
    try {
        const jsonResponse = await response.json();
        return {
            jsonResponse,
            httpStatusCode: response.status,
        };
    } catch (err) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
}

module.exports.createOrder = async(req, res, next) => {
    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        const { cart } = req.body;
        const { jsonResponse, httpStatusCode } = await createOrder(cart);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to create order." });
    }
}

module.exports.capturePayment = async(req, res, next) => {
    try {
        const { orderID } = req.params;
        const { jsonResponse, httpStatusCode } = await captureOrder(req, orderID);
        const eventBooking = await EventBooking.findById(jsonResponse.purchase_units[0].reference_id).populate('event').populate('eventTickets').populate('user').populate({ path: 'event', populate: { path: 'eventTickets' } }).populate({ path: 'event', populate: { path: 'eventTickets' } }).populate({ path: 'event', populate: { path: 'eventHost',populate: {path: 'eventSystem'} } });
        
        await res.render('print/ticket', { eventBooking, title: `Event Ticket` }, async function (err, ticket) {
            await pdfService.generatePDF(ticket)
                .then(async (ticketPdf) => {
                    res.render('email/paidBooking', { booking: eventBooking, title: 'Your payment and ticket wait inside' }, async function (err, str) {
                        emailService.sendEmail(eventBooking.user.username, `Payment receipt for ${eventBooking.event.name}`, str, ticketPdf ,`ticket.pdf`);
                        return res.status(httpStatusCode).json(jsonResponse);
                    })
            })
        })

    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to capture order." });
    }
}

module.exports.success = async(req, res, next) => {

}

module.exports.cancelled = async(req, res, next) => {
    req.flash('error', "Payment was not completed successfully");
    res.redirect('/account/bookings');
}