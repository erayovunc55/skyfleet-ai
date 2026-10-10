import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const commons=name=>{const hash=crypto.createHash('md5').update(name).digest('hex');return `https://upload.wikimedia.org/wikipedia/commons/${hash[0]}/${hash.slice(0,2)}/${encodeURIComponent(name)}`;};
const photos=[['bosphorus','https://images.pexels.com/photos/35394859/pexels-photo-35394859.jpeg?auto=compress&cs=tinysrgb&w=1920'],['old-city',commons('Blue_Mosque_and_Hagia_Sophia_panorama,_Istanbul,_Turkey_(9603565867).jpg')],['islands',commons('A_view_from_Buyukada.JPG')],['galata','https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1400&q=85']];
await fs.mkdir('website/src/assets/tours',{recursive:true});
for(const [name,url] of photos){const response=await fetch(url);if(!response.ok)throw new Error(`${name}: ${response.status}`);const source=await loadImage(Buffer.from(await response.arrayBuffer()));const width=Math.min(1920,source.width);const height=Math.round(width/source.width*source.height);const canvas=createCanvas(width,height);canvas.getContext('2d').drawImage(source,0,0,width,height);await fs.writeFile(`website/src/assets/tours/${name}.jpg`,canvas.toBuffer('image/jpeg',85));console.log(name,width,height);}
