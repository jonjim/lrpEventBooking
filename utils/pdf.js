const { chromium } = require('playwright')
async function sendPDF(res, html, filename) {
    let browser;
    (async() => {
        browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,headless: true })
        const page = await browser.newPage();
        await page.setContent(html);
        const pdf = await page.pdf({ format: "A4" });
        res.contentType("application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${filename}`
        );
        return res.send(pdf);
    })()
    .finally(() => browser?.close());
}

async function sendConfidentialPDF(res, html, filename) {
    let browser;
    (async () => {
        browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,headless: true });
        const page = await browser.newPage();
        await page.setContent(html);
        const pdf = await page.pdf({
            format: "A4",
            margin: {
                top: "40px",
                botom: "40px"
            }
        });
        res.contentType("application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${filename}`
        );
        return res.send(pdf);
    })()
    .finally(() => browser?.close());
}

module.exports = { sendPDF, sendConfidentialPDF }