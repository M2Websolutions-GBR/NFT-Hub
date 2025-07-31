import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

// Beispiel für Linux/Ubuntu (ggf. anpassen für Windows/Mac)
const CHROME_PATH = '/usr/bin/google-chrome'; // oder chromium-browser

export const generateCertificatePDF = async ({ buyerName, buyerEmail, nftTitle, creatorName, price, date }) => {
  const fileName = `${nftTitle}_${buyerName}`.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
  const filePath = path.resolve('certificates', fileName);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #333; }
          p { font-size: 18px; }
        </style>
      </head>
      <body>
        <h1>🎉 NFT-Zertifikat</h1>
        <p><strong>Käufer:</strong> ${buyerName}</p>
        <p><strong>Email:</strong> ${buyerEmail}</p>
        <p><strong>Titel:</strong> ${nftTitle}</p>
        <p><strong>Ersteller:</strong> ${creatorName}</p>
        <p><strong>Preis:</strong> ${price} ETH</p>
        <p><strong>Kaufdatum:</strong> ${date}</p>
      </body>
    </html>
  `;

  await page.setContent(htmlContent);
  await page.pdf({ path: filePath, format: 'A4' });

  await browser.close();

  return { fileName, filePath };
};
