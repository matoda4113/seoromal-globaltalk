const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  const svgPath = path.join(__dirname, '../public/logo.svg');
  const pngPath = path.join(__dirname, '../public/logo.png');

  try {
    const svgBuffer = fs.readFileSync(svgPath);

    await sharp(svgBuffer)
      .png()
      .toFile(pngPath);

    console.log('✅ logo.png created successfully!');
  } catch (error) {
    console.error('❌ Error converting SVG to PNG:', error);
  }
}

convertSvgToPng();
