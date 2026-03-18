// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require('playwright');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

(async () => {
  const photoPath = path.resolve(__dirname, '../public/photos/1748466072957.jpeg');

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1707 },
    deviceScaleFactor: 1,
  });

  // Navy duotone: grayscale the image, then use a navy background
  // showing through with screen blend to get navy shadows / cream highlights
  await page.setContent(`
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 1280px;
          height: 1707px;
          position: relative;
          overflow: hidden;
        }
        .duotone {
          width: 1280px;
          height: 1707px;
          position: relative;
          background: #1a365d;
        }
        .duotone img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: grayscale(100%) contrast(1.0) brightness(0.9);
          mix-blend-mode: screen;
        }
        /* Cream color overlay for highlights */
        .duotone::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(245, 241, 235, 0.08), rgba(245, 241, 235, 0.03));
          pointer-events: none;
        }
      </style>
    </head>
    <body>
      <div class="duotone">
        <img src="file://${photoPath}" />
      </div>
    </body>
    </html>
  `);

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.resolve(__dirname, '../public/linkedin-banner.png'), type: 'png' });
  await browser.close();
  console.log('Done: public/linkedin-banner.png');
})();
