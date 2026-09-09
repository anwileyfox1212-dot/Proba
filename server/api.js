// REST API КИМ БАО — без внешних зависимостей.
import {
	db,
	save,
	newId,
	hashPassword,
	verifyPassword,
	findUserByLogin,
	findUserById,
	publicUser,
	createSession,
	userByToken,
	destroySession,
	nextOrderNumber,
	ORDER_FLOW,
	ORDER_STATUSES,
	STATUS_LABELS
} from './db.js'
import { MENU, CATEGORIES, findDish } from './menu.js'

const DELIVERY_FEE = 190
const FREE_DELIVERY_FROM = 1500

class ApiError extends Error {
	constructor(status, message) {
		super(message)
		this.status = status
	}
}

function requireAuth(ctx) {
	if (!ctx.user) throw new ApiError(401, 'Требуется авторизация')
	return ctx.user
}

function requireAdmin(ctx) {
	const user = requireAuth(ctx)
	if (user.role !== 'admin') throw new ApiError(403, 'Доступ только для администратора')
	return user
}

function str(value) {
	return typeof value === 'string' ? value.trim() : ''
}

function orderView(order, { withUser = false } = {}) {
	const view = {
		...order,
		statusLabel: STATUS_LABELS[order.status] || order.status,
		flow: ORDER_FLOW
	}
	if (withUser) {
		const user = findUserById(order.userId)
		view.user = publicUser(user)
	}
	return view
}

function calcTotals(items) {
	const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
	const delivery = subtotal >= FREE_DELIVERY_FROM || subtotal === 0 ? 0 : DELIVERY_FEE
	return { subtotal, delivery, total: subtotal + delivery }
}

const routes = [
	// ── Меню ─────────────────────────────────
	{
		method: 'GET',
		path: /^\/api\/menu$/,
		handler: () => ({
			categories: CATEGORIES,
			dishes: MENU,
			delivery: { fee: DELIVERY_FEE, freeFrom: FREE_DELIVERY_FROM }
		})
	},

	// ── Аутентификация ────────────────────────
	{
		method: 'POST',
		path: /^\/api\/auth\/register$/,
		handler: (ctx) => {
			const login = str(ctx.body.login).toLowerCase()
			const password = str(ctx.body.password)
			const name = str(ctx.body.name) || login
			const phone = str(ctx.body.phone)
			if (login.length < 3) throw new ApiError(400, 'Логин должен содержать минимум 3 символа')
			if (!/^[a-z0-9_.-]+$/i.test(login)) throw new ApiError(400, 'Логин: латиница, цифры, . _ -')
			if (password.length < 5) throw new ApiError(400, 'Пароль должен содержать минимум 5 символов')
			if (findUserByLogin(login)) throw new ApiError(409, 'Такой логин уже занят')
			const user = {
				id: newId('usr'),
				login,
				name,
				phone,
				address: str(ctx.body.address),
				role: 'user',
				passwordHash: hashPassword(password),
				createdAt: new Date().toISOString()
			}
			db().users.push(user)
			save()
			const token = createSession(user.id)
			return { token, user: publicUser(user) }
		}
	},
	{
		method: 'POST',
		path: /^\/api\/auth\/login$/,
		handler: (ctx) => {
			const user = findUserByLogin(ctx.body.login)
			if (!user || !verifyPassword(str(ctx.body.password), user.passwordHash)) {
				throw new ApiError(401, 'Неверный логин или пароль')
			}
			return { token: createSession(user.id), user: publicUser(user) }
		}
	},
	{
		method: 'POST',
		path: /^\/api\/auth\/logout$/,
		handler: (ctx) => {
			if (ctx.token) destroySession(ctx.token)
			return { ok: true }
		}
	},
	{
		method: 'GET',
		path: /^\/api\/auth\/me$/,
		handler: (ctx) => ({ user: publicUser(requireAuth(ctx)) })
	},
	{
		method: 'POST',
		path: /^\/api\/auth\/profile$/,
		handler: (ctx) => {
			const user = requireAuth(ctx)
			if (ctx.body.name !== undefined) user.name = str(ctx.body.name) || user.name
			if (ctx.body.phone !== undefined) user.phone = str(ctx.body.phone)
			if (ctx.body.address !== undefined) user.address = str(ctx.body.address)
			save()
			return { user: publicUser(user) }
		}
	},

	// ── Заказы клиента ───────────────────────────
	{
		method: 'POST',
		path: /^\/api\/orders$/,
		handler: (ctx) => {
			const user = requireAuth(ctx)
			const rawItems = Array.isArray(ctx.body.items) ? ctx.body.items : []
			const items = []
			for (const raw of rawItems) {
				const dish = findDish(str(raw.id))
				const qty = Math.max(1, Math.min(30, Number(raw.qty) || 0))
				if (!dish) throw new ApiError(400, `Блюдо не найдено: ${raw.id}`)
				items.push({ id: dish.id, name: dish.name, price: dish.price, qty })
			}
			if (!items.length) throw new ApiError(400, 'Корзина пуста')
			const name = str(ctx.body.name) || user.name
			const phone = str(ctx.body.phone)
			const address = str(ctx.body.address)
			if (phone.length < 5) throw new ApiError(400, 'Укажите телефон')
			if (address.length < 5) throw new ApiError(400, 'Укажите адрес доставки')
			const totals = calcTotals(items)
			const now = new Date().toISOString()
			const order = {
				id: newId('ord'),
				number: nextOrderNumber(),
				userId: user.id,
				items,
				...totals,
				customer: { name, phone, address, comment: str(ctx.body.comment) },
				payment: ctx.body.payment === 'card' ? 'card' : 'cash',
				status: 'new',
				rejectReason: null,
				history: [{ status: 'new', at: now }],
				createdAt: now,
				updatedAt: now
			}
			db().orders.push(order)
			save()
			return { order: orderView(order) }
		}
	},
	{
		method: 'GET',
		path: /^\/api\/orders$/,
		handler: (ctx) => {
			const user = requireAuth(ctx)
			const orders = db()
				.orders.filter((o) => o.userId === user.id)
				.sort((a, b) => b.number - a.number)
				.map((o) => orderView(o))
			return { orders }
		}
	},
	{
		method: 'GET',
		path: /^\/api\/orders\/([\w-]+)$/,
		handler: (ctx) => {
			const user = requireAuth(ctx)
			const order = db().orders.find((o) => o.id === ctx.params[0] || String(o.number) === ctx.params[0])
			if (!order) throw new ApiError(404, 'Заказ не найден')
			if (order.userId !== user.id && user.role !== 'admin') throw new ApiError(403, 'Нет доступа к заказу')
			return { order: orderView(order, { withUser: user.role === 'admin' }) }
		}
	},

	// ── Администратор ─────────────────────────
	{
		method: 'GET',
		path: /^\/api\/admin\/orders$/,
		handler: (ctx) => {
			requireAdmin(ctx)
			const orders = db()
				.orders.slice()
				.sort((a, b) => b.number - a.number)
				.map((o) => orderView(o, { withUser: true }))
			return { orders, statuses: ORDER_STATUSES, labels: STATUS_LABELS }
		}
	},
	{
		method: 'POST',
		path: /^\/api\/admin\/orders\/([\w-]+)\/status$/,
		handler: (ctx) => {
			requireAdmin(ctx)
			const status = str(ctx.body.status)
			if (!ORDER_STATUSES.includes(status)) throw new ApiError(400, 'Неизвестный статус')
			const order = db().orders.find((o) => o.id === ctx.params[0])
			if (!order) throw new ApiError(404, 'Заказ не найден')
			if (order.status === status) return { order: orderView(order, { withUser: true }) }
			order.status = status
			order.rejectReason = status === 'rejected' ? str(ctx.body.reason) || 'Без указания причины' : null
			order.updatedAt = new Date().toISOString()
			order.history.push({ status, at: order.updatedAt })
			save()
			return { order: orderView(order, { withUser: true }) }
		}
	},
	{
		method: 'GET',
		path: /^\/api\/admin\/users$/,
		handler: (ctx) => {
			requireAdmin(ctx)
			const orders = db().orders
			const users = db()
				.users.map((u) => {
					const mine = orders.filter((o) => o.userId === u.id)
					return {
						...publicUser(u),
						ordersCount: mine.length,
						spent: mine.filter((o) => o.status !== 'rejected').reduce((s, o) => s + o.total, 0)
					}
				})
				.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
			return { users }
		}
	},
	{
		method: 'GET',
		path: /^\/api\/admin\/stats$/,
		handler: (ctx) => {
			requireAdmin(ctx)
			const orders = db().orders
			const active = orders.filter((o) => !['done', 'rejected'].includes(o.status))
			return {
				totalOrders: orders.length,
				newOrders: orders.filter((o) => o.status === 'new').length,
				activeOrders: active.length,
				revenue: orders.filter((o) => o.status === 'done').reduce((s, o) => s + o.total, 0),
				users: db().users.filter((u) => u.role === 'user').length
			}
		}
	}
]

export async function handleApi(req, res, pathname, rawBody) {
	let body = {}
	if (rawBody) {
		try {
			body = JSON.parse(rawBody)
		} catch {
			return send(res, 400, { error: 'Некорректный JSON' })
		}
	}
	const header = req.headers.authorization || ''
	const token = header.startsWith('Bearer ') ? header.slice(7) : ''
	const ctx = { req, body, token, user: userByToken(token), params: [] }

	let pathMatched = false
	for (const route of routes) {
		const match = pathname.match(route.path)
		if (!match) continue
		pathMatched = true
		if (route.method !== req.method) continue
		ctx.params = match.slice(1)
		try {
			const result = await route.handler(ctx)
			return send(res, 200, result ?? { ok: true })
		} catch (error) {
			if (error instanceof ApiError) return send(res, error.status, { error: error.message })
			console.error('[api]', error)
			return send(res, 500, { error: 'Внутренняя ошибка сервера' })
		}
	}
	if (pathMatched) return send(res, 405, { error: 'Метод не поддерживается' })
	return send(res, 404, { error: 'Метод API не найден' })
}

function send(res, status, payload) {
	const data = JSON.stringify(payload)
	res.writeHead(status, {
		'Content-Type': 'application/json; charset=utf-8',
		'Cache-Control': 'no-store',
		'Content-Length': Buffer.byteLength(data)
	})
	res.end(data)
}
