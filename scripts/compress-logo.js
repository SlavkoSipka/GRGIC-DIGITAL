const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = 'C:/Users/User/Desktop/sajtovi/MARKO GRGIC FIRMA/assets/MARKO DIGITAL LOGO.png';
const OUT_DIR = path.resolve(__dirname, '..', 'assets');

(async () => {
  if (!fs.existsSync(SRC)) {
    console.error('Source logo not found at', SRC);
    process.exit(1);
  }

  await sharp(SRC)
    .resize({ width: 1024, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(path.join(OUT_DIR, 'logo.webp'));

  await sharp(SRC)
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(path.join(OUT_DIR, 'logo-sm.webp'));

  await sharp(SRC)
    .resize({ width: 64, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, 'favicon.png'));

  console.log('Logo compressed successfully');
})();
