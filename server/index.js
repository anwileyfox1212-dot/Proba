// HTTP-сервер КИМ БАО: статика + REST API. Только стандартная библиотека Node.js.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleApi } from './api.js'
import { db, ADMIN_LOGIN, ADMIN_PASSWORD } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const PUBLIC_DIR = fs.existsSync(path.join(ROOT, 'dist')) && process.env.SERVE_DIST === '1'
	? path.join(ROOT, 'dist')
	: path.join(ROOT, 'public')

const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST || 'localhost'

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.woff2': 'font/woff2',
	'.txt': 'text/plain; charset=utf-8'
}

function readBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = []
		let size = 0
		req.on('data', (chunk) => {
			size += chunk.length
			if (size > 1_000_000) {
				reject(new Error('Слишком большой запрос'))
				req.destroy()
				return
			}
			chunks.push(chunk)
		})
		req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
		req.on('error', reject)
	})
}

function serveFile(res, filePath, status = 200) {
	const ext = path.extname(filePath).toLowerCase()
	fs.readFile(filePath, (error, data) => {
		if (error) {
			res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
			res.end('404 — файл не найден')
			return
		}
		res.writeHead(status, {
			'Content-Type': MIME[ext] || 'application/octet-stream',
			'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
			'Content-Length': data.length
		})
		res.end(data)
	})
}

const server = http.createServer(async (req, res) => {
	const pathname = decodeURIComponent((req.url || '/').split('?')[0])

	if (pathname.startsWith('/api/')) {
		try {
			const rawBody = req.method === 'POST' || req.method === 'PUT' ? await readBody(req) : ''
			return handleApi(req, res, pathname, rawBody)
		} catch (error) {
			res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
			return res.end(JSON.stringify({ error: error.message }))
		}
	}

	const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '')
	let filePath = path.join(PUBLIC_DIR, safePath)
	if (!filePath.startsWith(PUBLIC_DIR)) filePath = PUBLIC_DIR

	if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
		return serveFile(res, filePath)
	}
	// SPA fallback — все маршруты отдают index.html
	return serveFile(res, path.join(PUBLIC_DIR, 'index.html'))
})

server.listen(PORT, () => {
	db() // инициализация БД и аккаунта администратора
	console.log('\nКИМ БАО — сервер запущен')
	console.log('Сайт:  ' + 'http' + '://' + HOST + ':' + PORT)
	console.log(`Файлы: ${PUBLIC_DIR}`)
	console.log(`Админ: логин "${ADMIN_LOGIN}", пароль "${ADMIN_PASSWORD}" — панель на /admin\n`)
})

export default server
