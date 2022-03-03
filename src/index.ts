import { config } from 'dotenv';
import { chromium } from 'playwright';
import { NODE_ENV, SLOWNESS, USER_DATA_DIR } from './config';

config({
    debug: NODE_ENV === 'dev'
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
    if (qrLocator != null) {
        const qrImageBytes = await qrLocator.evaluate(x => {
            const canvas = x as HTMLCanvasElement;
            const image = canvas.getContext('2d').getImageData(0, 0, canvas.clientWidth, canvas.clientHeight);
            return image.data;
        });
        
    } else {
        
    }
})();
