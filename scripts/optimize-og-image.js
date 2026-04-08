const sharp = require('sharp');
const path = require('path');

async function optimizeOGImage() {
  try {
    const inputPath = path.join(__dirname, '../public/assets/og-image-original.png');
    const outputPath = path.join(__dirname, '../public/assets/og-image.png');
    
    await sharp(inputPath)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center'
      })
      .png({
        quality: 85,
        compressionLevel: 8
      })
      .toFile(outputPath);
    
  } catch (error) {
    console.error('Error optimizing OG image:', error);
  }
}

optimizeOGImage();
