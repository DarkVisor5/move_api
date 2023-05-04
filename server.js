const http = require('http');
const url = require('url');
const fs = require('fs');

const server = http.createServer((request, response) => {
  const parsedUrl = url.parse(request.url);
  const path = parsedUrl.pathname === '/documentation' ? '/documentation.html' : '/index.html';
  const filePath = `.${path}`;

  const logEntry = `${new Date().toISOString()} - ${request.url}\n`;
  fs.appendFile('log.txt', logEntry, (err) => {
    if (err) {
      console.error('Error logging request:', err);
    }
  });

  fs.readFile(filePath, (err, data) => {
    if (err) {
      response.writeHead(500);
      response.end('Error loading file');
    } else {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end(data);
    }
  });
});

server.listen(8080, () => {
  console.log('Server running on port 8080');
});
