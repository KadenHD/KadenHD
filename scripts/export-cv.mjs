import assert from 'node:assert/strict';
import { mkdtemp, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';

const root = fileURLToPath(new URL('../', import.meta.url));
const cvs = ['CV_Pierre_Clement', 'CV_Pierre_Clement_EN'];
const args = process.argv.slice(2);

if (args.some(arg => arg !== '--no-sandbox')) {
  console.error('Usage: npm run cv:pdf -- [--no-sandbox]');
  process.exitCode = 1;
} else {
  await exportPdfs();
}

async function exportPdfs() {
  const browser = await puppeteer.launch({
    headless: true,
    args: args.includes('--no-sandbox') ? ['--no-sandbox'] : [],
  });
  let temporary;

  try {
    temporary = await mkdtemp(path.join(root, '.cv-pdf-'));

    for (const cv of cvs) {
      const page = await browser.newPage();
      try {
        // Match the A4 content area defined by @page: 210 mm minus 2 x 14 mm.
        await page.setViewport({ width: 688, height: 1017 });
        await page.emulateMediaType('print');
        await page.goto(pathToFileURL(path.join(root, `${cv}.html`)).href, {
          waitUntil: 'load',
        });

        const layout = await page.evaluate(async () => {
          await document.fonts.load('500 10pt Nunito');
          await document.fonts.load('700 10pt Nunito');
          await document.fonts.ready;
          const sheets = [...document.querySelectorAll('.cv-page')];
          return {
            fontLoaded: [...document.fonts].some(
              font => font.family === 'Nunito' && font.status === 'loaded',
            ),
            heights: sheets.map(sheet => sheet.getBoundingClientRect().height),
            wrappedDates: [...document.querySelectorAll('.entry-date')]
              .filter(date => date.getBoundingClientRect().height >
                parseFloat(getComputedStyle(date).lineHeight) + 1)
              .map(date => date.textContent.trim()),
          };
        });

        assert.ok(layout.fontLoaded, `${cv}: Nunito could not be loaded`);
        assert.equal(layout.heights.length, 2, `${cv}: expected two print sheets`);
        // Printable A4 height: 297 mm minus 2 x 14 mm, converted to CSS pixels.
        assert.ok(layout.heights.every(height => height <= 269 * 96 / 25.4),
          `${cv}: content exceeds an A4 page; adjust the layout before exporting`);
        assert.deepEqual(layout.wrappedDates, [], `${cv}: a date wraps onto two lines`);

        await page.pdf({
          path: path.join(temporary, `${cv}.pdf`),
          format: 'A4',
          preferCSSPageSize: true,
          printBackground: true,
          displayHeaderFooter: false,
        });
      } finally {
        await page.close();
      }
    }

    // Replace the existing PDFs only once both exports have succeeded.
    for (const cv of cvs) {
      await rename(path.join(temporary, `${cv}.pdf`), path.join(root, `${cv}.pdf`));
      console.log(`Generated ${cv}.pdf`);
    }
  } finally {
    try {
      await browser.close();
    } finally {
      if (temporary) await rm(temporary, { recursive: true, force: true });
    }
  }
}
