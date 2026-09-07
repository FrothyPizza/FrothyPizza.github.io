/**
 * Zero-dependency static server for local play-testing.
 *
 * Serves the *repository root* (not this directory) so the sequel, the
 * original and the rest of the site all resolve from one origin:
 *
 *   node "Samurai Slasher 2/tools/serve.js"          # http://127.0.0.1:8765
 *   node "Samurai Slasher 2/tools/serve.js" 9000     # custom port
 *
 * Sequel:   http://127.0.0.1:8765/Samurai%20Slasher%202/index.html
 * Original: http://127.0.0.1:8765/Samurai%20Slasher/index.html
 *
 * ES modules need a real HTTP origin, so `file://` will not work.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const port = Number(process.argv[2] || 8765);
const host = '127.0.0.1';

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.wav': 'audio/wav',
	'.mp3': 'audio/mpeg',
	'.ico': 'image/x-icon',
	'.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
	let pathname;
	try {
		pathname = decodeURIComponent(new URL(req.url, `http://${host}`).pathname);
	} catch {
		res.writeHead(400).end('Bad request');
		return;
	}

	let filePath = path.join(root, pathname);
	// Never serve outside the repository root.
	if (!filePath.startsWith(root)) {
		res.writeHead(403).end('Forbidden');
		return;
	}

	fs.stat(filePath, (err, stats) => {
		if (!err && stats.isDirectory()) filePath = path.join(filePath, 'index.html');
		fs.readFile(filePath, (readErr, data) => {
			if (readErr) {
				res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
				return;
			}
			res.writeHead(200, {
				'Content-Type': TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
				'Cache-Control': 'no-cache',
			});
			res.end(data);
		});
	});
});

server.listen(port, host, () => {
	console.log(`serving ${root}`);
	console.log(`  sequel:   http://${host}:${port}/Samurai%20Slasher%202/index.html`);
	console.log(`  original: http://${host}:${port}/Samurai%20Slasher/index.html`);
});
