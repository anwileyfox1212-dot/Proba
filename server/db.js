// Простая локальная БД на JSON-файле (без внешних зависимостей).
// Файл создаётся автоматически из схемы server/schema.json при первом запуске.

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

export const ORDER_FLOW = ['new', 'accepted', 'cooking', 'ready', 'delivering', 'done']
export const ORDER_STATUSES = [...ORDER_FLOW, 'rejected']
export const STATUS_LABELS = {
	new: 'Новый',
	accepted: 'Принят',
	cooking: 'Готовится',
	ready: 'Готов',
	delivering: 'Передан в доставку',
	done: 'Выполнен',
	rejected: 'Отклонён'
}

export const ADMIN_LOGIN = 'admin'
export const ADMIN_PASSWORD = 'admin123'

let cache = null

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
	const hash = crypto.pbkdf2Sync(String(password), salt, 60000, 32, 'sha256').toString('hex')
	return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
	if (typeof stored !== 'string' || !stored.includes(':')) return false
	const [salt, hash] = stored.split(':')
	const test = crypto.pbkdf2Sync(String(password), salt, 60000, 32, 'sha256').toString('hex')
	if (test.length !== hash.length) return false
	return crypto.timingSafeEqual(Buffer.from(test, 'hex'), Buffer.from(hash, 'hex'))
}

export function newId(prefix) {
	return `${prefix}_${crypto.randomBytes(8).toString('hex')}`
}

function emptyDb() {
	const now = new Date().toISOString()
	return {
		version: 1,
		counters: { order: 1000 },
		users: [
			{
				id: newId('usr'),
				login: ADMIN_LOGIN,
				name: 'Администратор КИМ БАО',
				phone: '+7 900 000-00-00',
				address: '',
				role: 'admin',
				passwordHash: hashPassword(ADMIN_PASSWORD),
				createdAt: now
			}
		],
		orders: [],
		sessions: []
	}
}

function load() {
	if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
	if (!fs.existsSync(DB_FILE)) {
		const fresh = emptyDb()
		fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2), 'utf8')
		return fresh
	}
	try {
		const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
		parsed.users ||= []
		parsed.orders ||= []
		parsed.sessions ||= []
		parsed.counters ||= { order: 1000 }
		if (!parsed.users.some((u) => u.role === 'admin')) {
			parsed.users.push(emptyDb().users[0])
		}
		return parsed
	} catch (error) {
		console.error('[db] Файл БД повреждён, создаю новый:', error.message)
		const fresh = emptyDb()
		fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2), 'utf8')
		return fresh
	}
}

export function db() {
	if (!cache) cache = load()
	return cache
}

export function save() {
	const tmp = `${DB_FILE}.tmp`
	fs.writeFileSync(tmp, JSON.stringify(db(), null, 2), 'utf8')
	fs.renameSync(tmp, DB_FILE)
}

export function resetForTests() {
	cache = emptyDb()
	save()
}

// ── Пользователи ─────────────────────────────
export function findUserByLogin(login) {
	const normalized = String(login || '').trim().toLowerCase()
	return db().users.find((u) => u.login.toLowerCase() === normalized) || null
}

export function findUserById(id) {
	return db().users.find((u) => u.id === id) || null
}

export function publicUser(user) {
	if (!user) return null
	return {
		id: user.id,
		login: user.login,
		name: user.name,
		phone: user.phone || '',
		address: user.address || '',
		role: user.role,
		createdAt: user.createdAt
	}
}

// ── Сессии ───────────────────────────────
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30

export function createSession(userId) {
	const token = crypto.randomBytes(24).toString('hex')
	db().sessions.push({ token, userId, createdAt: new Date().toISOString() })
	save()
	return token
}

export function userByToken(token) {
	if (!token) return null
	const session = db().sessions.find((s) => s.token === token)
	if (!session) return null
	if (Date.now() - new Date(session.createdAt).getTime() > SESSION_TTL_MS) {
		destroySession(token)
		return null
	}
	return findUserById(session.userId)
}

export function destroySession(token) {
	const store = db()
	store.sessions = store.sessions.filter((s) => s.token !== token)
	save()
}

// ── Заказы ────────────────────────────────
export function nextOrderNumber() {
	const store = db()
	store.counters.order = (store.counters.order || 1000) + 1
	return store.counters.order
}
