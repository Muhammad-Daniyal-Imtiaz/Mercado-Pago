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
    
    console.log('OG image optimized to 1200x630px');
    
    // Get image info
    const metadata = await sharp(outputPath).metadata();
    console.log(`New dimensions: ${metadata.width}x${metadata.height}`);
    console.log(`File size: ${(metadata.size / 1024 / 1024).toFixed(2)}MB`);
    
  } catch (error) {
    console.error('Error optimizing OG image:', error);
  }
}

optimizeOGImage();
