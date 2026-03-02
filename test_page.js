const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new"
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log("Navigating to /studio/keys...");
        await page.goto("http://localhost:3000/studio/keys", { waitUntil: "networkidle2" });

        // Login flow since this is the studio
        const emailInput = await page.$('input[name="email"]');
        if (emailInput) {
            console.log("Logging in first...");
            await page.type('input[name="email"]', "test@example.com");
            await page.type('input[name="password"]', "password123");
            await page.click('button[type="submit"]');
            await page.waitForNavigation({ waitUntil: "networkidle2" });
        }

        // Wait for the table to load
        await page.waitForSelector('table', { timeout: 10000 });

        // Take a screenshot
        await page.screenshot({ path: "keys_table_test.png", fullPage: true });
        console.log("Screenshot saved to keys_table_test.png");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await browser.close();
    }
})();
