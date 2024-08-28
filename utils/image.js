const { chromium } = require('playwright');
const { cloudinary } = require('./cloudinary');
const Event = require('../models/lrpEvent');

module.exports.sendPNG = async function sendPNG(res, html, filename) {
    let browser;
    (async() => {
        browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,headless: true, args:['--use-gl=desktop','--use-angle=gl=egl'] })
        const page = await browser.newPage();
        await page.setContent(html);
        const content = await page.$('cardLayout');
        const imageBuffer = await page.locator('#cardLayout').screenshot();
        cloudinary.uploader.upload_stream((error, uploadResult) => {
            
        }).end(imageBuffer);
        res.contentType("image/jpg");
        res.setHeader(
            "Content-Disposition",
            `inline; filename="ogcard.jpg"`
        );
        
        return res.send(imageBuffer);
    })()
    .finally(() => browser?.close());
}

module.exports.createPNG = async function createPNG(html, eventId) {
    let browser;
    (async () => {
        browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--use-gl=desktop', '--use-angle=gl=egl'] })
        const event = await Event.findById(eventId).populate('eventHost').populate({path:'eventHost', populate: 'eventSystem'});
        const page = await browser.newPage();
        await page.setContent(html);
        const imageBuffer = await page.locator('#cardLayout').screenshot();
        // const uploadResponse = await new Promise((resolve) => {
        //     cloudinary.uploader.upload_stream((error, uploadResult) => {
        //         return resolve(uploadResult);
        //     }).end(imageBuffer);
        // })
        // console.log(uploadResponse);
        // return uploadResponse;
        await cloudinary.uploader.upload_stream((error, uploadResult) => {
            event.ogCard.url = uploadResult.url;
            event.ogCard.filename = uploadResult.filename;
            event.save();
        }).end(imageBuffer);
    })()
    .finally(() => browser?.close());
}