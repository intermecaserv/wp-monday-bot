import { config } from 'dotenv';
import { chromium } from 'playwright';
import express from 'express';
import { GROUP_NAME, NODE_ENV, SLOWNESS, USER_DATA_DIR } from './config';


config({
    debug: NODE_ENV === 'dev'
});

let qrImage: string | undefined;
let readQrInterval: any | undefined;
let readMessagesTimeout: any | undefined;

const app = express();

app.get('/', async (_, res) => {
    res
        .header('Content-Type', 'text/html')
        .send(`
        <img src="${qrImage}" />
        `);
});

app.listen(3000, () => {
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

    const processMessages = async () => {
        console.log('Doing...');
    }

    const startProcessingIncomingMessages = async () => {
        console.log('Processing messages...');
        await processMessages();
        readMessagesTimeout = setTimeout(() => {
            (async () => {
                await startProcessingIncomingMessages();
            })();
        }, 5000);
    }

    const startBot = async () => {
        // find group tab
        console.log('Trying to find the group tab...');
        const allGroupsLocator = wpPage.locator(`div[aria-label='Chat list']`);
        await allGroupsLocator.waitFor({ state: 'visible', timeout: 10000 });
        const groupTabLocator = allGroupsLocator.locator(`span`, {
            hasText: GROUP_NAME
        });
        await groupTabLocator.waitFor({ state: 'visible', timeout: 10000 });
        groupTabLocator.click();
        console.log('Clicked group tab.');
        console.log('Scanning all incoming messages...');
        await startProcessingIncomingMessages();
    }

    const readQrImage = async () => {
        const qrLocatorTest = await wpPage.$$('canvas[role=img]');
        if (!qrLocatorTest.length && readQrInterval != null) {
            console.log('QR scanned successfully. Starting bot.');
            clearInterval(readQrInterval);
            try {
                await startBot();
            } catch (err3) {
                console.error(err3);
                process.exit(1);
            } 
            return;
        }
        qrImage = await qrLocatorTest[0].evaluate(x => {
            const canvas = x as HTMLCanvasElement;
            return canvas.toDataURL("image/png");
        });
    };


    try {
        console.log('Scanning for QR...');
        await qrLocator.waitFor({ state: 'visible', timeout: 10000 });
        console.log('QR is visible, starting reading it every 5 sec.');
        await readQrImage();
        readQrInterval = setInterval(() => {
            (async () => {
                console.log('Reading QR...');
                await readQrImage();
            })();
        }, 5000);
    } catch (err) {
        console.log('QR not present, are we already logged in?');
        const searchBarLocator = wpPage.locator('text=Search or start new chat');
        try {
            await searchBarLocator.waitFor({ state: "visible", timeout: 10000 });
            console.log('We are logged in.');
            try {
                await startBot();
            } catch (err3) {
                console.error(err3);
                process.exit(1);
            } 
        } catch (err2) {
            console.error('We are not logged in. Error.');
            throw new Error('Login failed.');
        }
    }
})();