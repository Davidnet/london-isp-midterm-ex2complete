// Static dev server for report screenshots.
// Serves the whole repo (both submodule apps) and accepts POST /__shot
// with {name, dataURL} JSON bodies, written to report/figures/<name>.png.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIGURES = path.join(__dirname, 'figures');
const PORT = 8129;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

http
  .createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/__shot') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        try {
          const { name, dataURL } = JSON.parse(body);
          const safe = path.basename(String(name)).replace(/[^\w.-]/g, '_');
          const b64 = String(dataURL).replace(/^data:image\/png;base64,/, '');
          const file = path.join(FIGURES, safe + '.png');
          fs.writeFileSync(file, Buffer.from(b64, 'base64'));
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('saved ' + file);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('bad shot: ' + e.message);
        }
      });
      return;
    }

    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let file = path.normalize(path.join(ROOT, urlPath));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end('forbidden');
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('not found: ' + urlPath);
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      });
      res.end(data);
    });
  })
  .listen(PORT, '127.0.0.1', () => console.log(`shots server on http://127.0.0.1:${PORT}`));
