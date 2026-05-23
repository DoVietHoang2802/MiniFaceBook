const fs = require('fs');
const https = require('https');
const path = require('path');

const emojis = {
  like: '1f44d',
  love: '2764',
  haha: '1f602',
  wow: '1f62e',
  sad: '1f622',
  angry: '1f621'
};

const dir = path.join(__dirname, 'frontend', 'public', 'reactions');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

Object.entries(emojis).forEach(([name, code]) => {
  const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${code}.png`;
  const dest = path.join(dir, `${name}.png`);
  
  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Failed to download ${name}: ${res.statusCode}`);
      return;
    }
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${name}.png`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${name}: ${err.message}`);
  });
});
