const sharp = require('sharp');
const path = require('path');

async function generateLogo() {
  try {
    const inputSvg = path.join(__dirname, '../public/assets/icon-placeholder.svg');
    const outputPath = path.join(__dirname, '../public/assets/logo.png');
    
    await sharp(inputSvg)
      .resize(80, 80, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
  } catch (error) {
    console.error('Error generating logo:', error);
  }
}

generateLogo();
