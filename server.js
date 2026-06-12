const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const MIME = { html:'text/html', jsx:'application/javascript', js:'application/javascript', css:'text/css', png:'image/png', ico:'image/x-icon', svg:'image/svg+xml' };
http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  const file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  const ext = file.split('.').pop();
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(3000, () => console.log('Serving at http://localhost:3000'));
