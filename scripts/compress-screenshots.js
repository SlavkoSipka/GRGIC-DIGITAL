const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC_DIR = 'C:/Users/User/.cursor/projects/c-Users-User-Desktop-sajtovi-MARKO-GRGIC-FIRMA/assets';
const OUT_DIR = path.resolve(__dirname, '..', 'assets');

const jobs = [
  { src: 'c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_5ee3d4f7746951232041062cc27d5d57_images_image-909c3a88-fcbc-4be2-b291-e28870a719f2.png', out: 'nicemodels-desktop.webp', width: 1200, quality: 82 },
  { src: 'c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_5ee3d4f7746951232041062cc27d5d57_images_image-be30396a-b94e-4e5f-99c4-709534b7e725.png', out: 'nicemodels-mobile-1.webp', width: 600, quality: 82 },
  { src: 'c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_5ee3d4f7746951232041062cc27d5d57_images_Screenshot_2026-04-28_172519-5b7133e6-f503-4d5c-be01-513a40527509.png', out: 'nicemodels-mobile-2.webp', width: 600, quality: 82 },
  { src: 'c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_5ee3d4f7746951232041062cc27d5d57_images_image-eeff7a1e-02b7-450d-9f2b-2314cd978720.png', out: 'aisajt-seo.webp', width: 1400, quality: 90 },
];

(async () => {
  for (const job of jobs) {
    const src = path.join(SRC_DIR, job.src);
    if (!fs.existsSync(src)) {
      console.error('Missing:', src);
      continue;
    }
    await sharp(src)
      .resize({ width: job.width, withoutEnlargement: true })
      .webp({ quality: job.quality })
      .toFile(path.join(OUT_DIR, job.out));
    console.log('Wrote', job.out);
  }
})();
