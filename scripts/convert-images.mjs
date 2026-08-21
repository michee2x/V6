import sharp from 'sharp';

async function run() {
  const [logo, favicon, og] = await Promise.all([
    sharp('public/logo.png').webp({ quality: 85 }).toFile('public/logo.webp'),
    sharp('public/favicon.png').resize(64, 64).png({ compressionLevel: 9 }).toFile('public/favicon-opt.png'),
    sharp('public/og-image.png').webp({ quality: 85 }).toFile('public/og-image.webp'),
  ]);
  console.log('logo.webp:', logo);
  console.log('favicon-opt.png:', favicon);
  console.log('og-image.webp:', og);
}

run().catch(console.error);
