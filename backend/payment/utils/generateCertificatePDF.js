import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { generateCertificateHTML } from './certificate.template.js';

export const createCertificatePDF = async ({ username, title, nftId }) => {
  const date = new Date().toLocaleDateString();
  const htmlContent = generateCertificateHTML({ username, title, date });
  const outputPath = path.resolve('certificates', `${nftId}.pdf`);

 const browser = await puppeteer.launch({
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputPath, format: 'A4' });
  await browser.close();

  return outputPath; // für E-Mail-Versand
};
