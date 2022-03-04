import { config } from 'dotenv';
import { chromium } from 'playwright';
import express from 'express';
import { NODE_ENV, PORT, SLOWNESS, USER_DATA_DIR } from './config';


config({
    debug: NODE_ENV === 'dev'
});

let qrImage: string | undefined;
let readQrInterval: NodeJS.Timeout | undefined;

const app = express();

app.get('/', async (_, res) => {
    res
        .header('Content-Type', 'text/html')
        .send(`
        <img src="${qrImage}" />
        `);
});

app.listen(PORT, () => {
    console.log('API listening...');
});

(async () => {
    const browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: NODE_ENV !== 'dev',
        slowMo: SLOWNESS
    });
    const wpPage = browser.pages().length > 0 ? browser.pages()[0] : (await browser.newPage());
    await wpPage.goto('https://web.whatsapp.com', {
        referer: 'https://google.com'
    });

    const qrLocator = wpPage.locator('canvas[role=img]');

    const readQrImage = async () => {
        qrImage = await qrLocator.evaluate(x => {
            const canvas = x as HTMLCanvasElement;
            return canvas.toDataURL("image/png");
        });
        const qrLocatorTest = wpPage.locator('canvas[role=img]');
        if (qrLocatorTest == null && readQrInterval != null) {
            clearInterval(readQrInterval);
        }
    };

    if (qrLocator != null) {
        await readQrImage();
        readQrInterval = setInterval(() => {
            (async () => {
                await readQrImage();
            })();
        }, 5000);

    } else {

    }
})();