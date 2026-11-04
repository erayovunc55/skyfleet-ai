import { chromium } from './node_modules/playwright/index.mjs';
import { mkdir } from 'node:fs/promises';

const output = new URL('../hakkimizda-profesyonel-20261005/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const results = [];
try {
  for (const [language, width, height] of [['en',1440,1000],['tr',390,844]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    await context.addInitScript((lang) => localStorage.setItem('skytriptransfer-language', lang), language);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://localhost:5188/about', { waitUntil: 'networkidle' });
    await page.locator('.sky-about-detail-image').scrollIntoViewIfNeeded();
    await page.locator('.sky-about img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await page.locator('h1').scrollIntoViewIfNeeded();
    const layout = await page.evaluate(() => ({width:innerWidth,contentWidth:document.documentElement.scrollWidth,language:document.documentElement.lang,headings:[...document.querySelectorAll('main h1')].map(el=>el.textContent),images:[...document.querySelectorAll('main img')].map(el=>({loaded:el.complete&&el.naturalWidth>0}))}));
    if(layout.contentWidth>layout.width || layout.language!==language || layout.headings.length!==1 || layout.images.some(img=>!img.loaded) || errors.length) throw new Error(JSON.stringify({layout,errors}));
    await page.screenshot({path:new URL(`about-${language}-${width}.png`,output).pathname.replace(/^\/([A-Za-z]:)/,'$1'),fullPage:true});
    await page.getByRole('link',{name:language==='tr'?'Yaklaşımımızı keşfedin':'Discover our approach',exact:true}).click();
    if(!page.url().endsWith('#our-approach')) throw new Error('Approach anchor failed');
    if(language==='tr') {
      await page.getByRole('button',{name:'Menüyü aç',exact:true}).click();
      if(!await page.getByRole('navigation').isVisible()) throw new Error('Mobile menu failed');
      await page.getByRole('button',{name:'Menüyü aç',exact:true}).click();
    }
    await page.getByRole('link',{name:language==='tr'?'Yolculuğunuzu planlayın':'Plan your journey',exact:true}).click();
    if(new URL(page.url()).pathname!=='/transfer') throw new Error('Transfer link failed');
    results.push({language,...layout,links:'passed',errors});
    await context.close();
  }
  console.log(JSON.stringify(results,null,2));
} finally { await browser.close(); }
