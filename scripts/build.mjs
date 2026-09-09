// Production build: проверка и сборка статики в папку dist/.
// Запуск: npm run build   →   затем npm start или npm run start:dist
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(root, 'public')
const distDir = path.join(root, 'dist')
const serverDir = path.join(root, 'server')

let errors = 0
const log = (message) => console.log(message)
const fail = (message) => {
	errors += 1
	console.error(`  ✖ ${message}`)
}

function walk(dir, base = dir) {
	const out = []
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name)
		if (entry.isDirectory()) out.push(...walk(full, base))
		else out.push(path.relative(base, full))
	}
	return out
}

function checkModuleSyntax(file) {
	const tmp = path.join(os.tmpdir(), `kimbao-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`)
	fs.copyFileSync(file, tmp)
	try {
		execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' })
	} catch (error) {
		fail(`${path.relative(root, file)}: ${String(error.stderr || error.message).trim().split('\n')[0]}`)
	} finally {
		fs.rmSync(tmp, { force: true })
	}
}

function minifyCss(source) {
	return source
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/\s*\n\s*/g, '\n')
		.replace(/\n{2,}/g, '\n')
		.trim()
}

log('─'.repeat(52))
log('КИМ БАО · production build')
log('─'.repeat(52))

// 1. Проверка серверного кода
log('→ Проверка синтаксиса сервера')
for (const file of walk(serverDir).filter((f) => f.endsWith('.js'))) {
	checkModuleSyntax(path.join(serverDir, file))
}

// 2. Проверка клиентского кода
log('→ Проверка синтаксиса клиента')
const publicFiles = walk(publicDir)
for (const file of publicFiles.filter((f) => f.endsWith('.js'))) {
	checkModuleSyntax(path.join(publicDir, file))
}

// 3. Проверка JSON
log('→ Проверка JSON-файлов')
for (const file of ['package.json', 'server/schema.json']) {
	try {
		JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
	} catch (error) {
		fail(`${file}: ${error.message}`)
	}
}

// 4. Обязательные файлы
log('→ Проверка структуры')
for (const required of [
	'index.html',
	'css/style.css',
	'js/app.js',
	'js/store.js',
	'js/views.js',
	'js/admin.js',
	'js/motion.js',
	'js/art.js',
	'assets/favicon.svg'
]) {
	if (!publicFiles.includes(required.split('/').join(path.sep))) fail(`не найден public/${required}`)
}

if (errors) {
	console.error(`\nBuild прерван: ошибок — ${errors}`)
	process.exit(1)
}

// 5. Сборка
log('→ Сборка dist/')
fs.rmSync(distDir, { recursive: true, force: true })
fs.mkdirSync(distDir, { recursive: true })

let bytes = 0
for (const file of publicFiles) {
	const from = path.join(publicDir, file)
	const to = path.join(distDir, file)
	fs.mkdirSync(path.dirname(to), { recursive: true })
	if (file.endsWith('.css')) {
		const minified = minifyCss(fs.readFileSync(from, 'utf8'))
		fs.writeFileSync(to, minified, 'utf8')
	} else {
		fs.copyFileSync(from, to)
	}
	bytes += fs.statSync(to).size
}

fs.writeFileSync(
	path.join(distDir, 'build-info.json'),
	JSON.stringify({ builtAt: new Date().toISOString(), files: publicFiles.length, bytes }, null, 2),
	'utf8'
)

log(`✓ Готово: ${publicFiles.length} файлов, ${(bytes / 1024).toFixed(1)} КБ → dist/`)
log('  Запуск production-версии: npm run start:dist')
