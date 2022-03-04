import { config } from 'dotenv';
import { chromium } from 'playwright';
import express from 'express';
import { NODE_ENV, PORT, SLOWNESS, USER_DATA_DIR } from './config';


config({
    debug: NODE_ENV === 'dev'
});

let qrImageBytes: Blob | undefined;
let readQrInterval: NodeJS.Timeout | undefined;

const app = express();

app.get('/', async (_, res) => {
    res
        .header('Content-Disposition', 'attachment; filename=qr.png')
        .header('Content-Length', qrImageBytes == null ? '0' : qrImageBytes.size.toString())
        .send(qrImageBytes);
});

app.listen(PORT, () => {
    console.log('API listening...');
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

        const uriToBlob = (dataURI: string) => {
            var byteString = Buffer.from(dataURI.split(',')[1], 'base64');
            return new Blob([byteString]);
        }

        const readQrImage = async () => {
            qrImageBytes = await qrLocator.evaluate(x => {
                const canvas = x as HTMLCanvasElement;
                const dataUrl = canvas.toDataURL("image/png");
                return uriToBlob(dataUrl);
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
});

