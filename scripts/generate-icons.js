const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 70, 96, 128, 144, 150, 152, 180, 192, 310, 384, 512];
const inputSvg = path.join(__dirname, '../public/assets/icon-placeholder.svg');
const outputDir = path.join(__dirname, '../public/assets');

async function generateIcons() {
  try {
    // Asegurarse de que el directorio de salida exista
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generar iconos para cada tamaño
    for (const size of sizes) {
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    }

    // Generar OG image
    await sharp(inputSvg)
      .resize(1200, 630)
      .png()
      .toFile(path.join(outputDir, 'og-image.png'));
    
    // Generar screenshots de ejemplo
    const desktopIcon = await sharp(inputSvg).resize(200, 200).png().toBuffer();
    await sharp({
      create: {
        width: 1280,
        height: 720,
        channels: 4,
        background: { r: 17, g: 24, b: 39, alpha: 1 }
      }
    })
    .composite([{
      input: desktopIcon,
      gravity: 'center'
    }])
    .png()
    .toFile(path.join(outputDir, 'screenshot-desktop.png'));
    
    const mobileIcon = await sharp(inputSvg).resize(100, 100).png().toBuffer();
    await sharp({
      create: {
        width: 375,
        height: 667,
        channels: 4,
        background: { r: 17, g: 24, b: 39, alpha: 1 }
      }
    })
    .composite([{
      input: mobileIcon,
      gravity: 'center'
    }])
    .png()
    .toFile(path.join(outputDir, 'screenshot-mobile.png'));
    
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
