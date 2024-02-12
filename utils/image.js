const { chromium } = require('playwright')
module.exports.sendPNG = async function sendPNG(res, html, filename) {
    let browser;
    (async() => {
        browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,headless: true, args:['--use-gl=desktop','--use-angle=gl=egl'] })
        const page = await browser.newPage();
        await page.setContent(html);
        const content = await page.$('cardLayout');
        const imageBuffer = await page.locator('#cardLayout').screenshot();
        res.contentType("image/jpg");
        res.setHeader(
            "Content-Disposition",
            `inline; filename="ogcard.jpg"`
        );
        return res.send(imageBuffer);
    })()
    .finally(() => browser?.close());
}