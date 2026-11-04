import fs from 'node:fs/promises';
import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';
Object.assign(globalThis,{DOMMatrix,ImageData,Path2D});
const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
const pdf = await getDocument({data:new Uint8Array(await fs.readFile('C:/Users/tlb-o/Downloads/Buta 2026 Bahar-Acenta Ödeme Türkçe.pdf')),useSystemFonts:true}).promise;
await fs.mkdir('artifacts/istanbul-turlar-20261005/pdf-review',{recursive:true});
let text='';
for(let i=1;i<=pdf.numPages;i++) {
 const page=await pdf.getPage(i);
 const content=await page.getTextContent();
 text+=`\n--- PAGE ${i} ---\n`+content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('')+'\n';
 const viewport=page.getViewport({scale:1.2});
 const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
 await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
 await fs.writeFile(`artifacts/istanbul-turlar-20261005/pdf-review/page-${i}.png`,canvas.toBuffer('image/png'));
}
await fs.writeFile('artifacts/istanbul-turlar-20261005/pdf-review/text.txt',text);
console.log(`Pages: ${pdf.numPages}\n${text}`);
