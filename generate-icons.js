const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

// Icon sizes needed for Windows ICO (standard sizes)
const sizes = [16, 32, 48, 256];

async function generateIcons() {
  const svgBuffer = fs.readFileSync('assets/icon.svg');
  
  // Generate PNG files for different sizes
  const pngFiles = [];
  
  for (const size of sizes) {
    const fileName = `assets/icon-${size}.png`;
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(fileName);
    
    console.log(`Generated icon-${size}.png`);
    pngFiles.push(fileName);
  }
  
  // Generate main icon.png (256x256)
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile('assets/icon.png');
  
  console.log('Generated main icon.png');
  
  // Generate proper ICO file using png-to-ico
  const icoBuffer = await pngToIco(pngFiles);
  fs.writeFileSync('assets/icon.ico', icoBuffer);
  
  console.log('Generated proper icon.ico with png-to-ico');
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);