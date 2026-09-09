// Состояние клиента: меню, пользователь, корзина (localStorage) и обёртка над API.

const TOKEN_KEY = 'kimbao.token'
const CART_KEY = 'kimbao.cart'

export const state = {
	user: null,
	menu: { categories: [], dishes: [], delivery: { fee: 190, freeFrom: 1500 } },
	cart: [],
	ready: false
}

const listeners = new Set()

export function subscribe(fn) {
	listeners.add(fn)
	return () => listeners.delete(fn)
}

function emit() {
	listeners.forEach((fn) => fn(state))
}

export function money(value) {
	return `${Number(value || 0).toLocaleString('ru-RU')} ₽`
}

export function getToken() {
	try {
		return localStorage.getItem(TOKEN_KEY) || ''
	} catch (error) {
		return ''
	}
}

function setToken(token) {
	try {
		if (token) localStorage.setItem(TOKEN_KEY, token)
		else localStorage.removeItem(TOKEN_KEY)
	} catch (error) {
		/* localStorage может быть недоступен */
	}
}

// ── API ───────────────────────────────────
export async function api(path, { method = 'GET', body } = {}) {
	const headers = {}
	const token = getToken()
	if (token) headers.Authorization = `Bearer ${token}`
	if (body !== undefined) headers['Content-Type'] = 'application/json'
	const response = await fetch(path, {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body)
	})
	let payload = null
	try {
		payload = await response.json()
	} catch (error) {
		payload = null
	}
	if (!response.ok) {
		const message = (payload && (payload.error || payload.message)) || `Ошибка ${response.status}`
		const error = new Error(message)
		error.status = response.status
		throw error
	}
	return payload || {}
}

// ── Меню ───────────────────────────────
export async function loadMenu() {
	if (state.menu.dishes.length) return state.menu
	const data = await api('/api/menu')
	state.menu = {
		categories: data.categories || [],
		dishes: data.dishes || [],
		delivery: data.delivery || state.menu.delivery
	}
	return state.menu
}

export function findDish(id) {
	return state.menu.dishes.find((dish) => dish.id === id) || null
}

// ── Авторизация ─────────────────────────
export async function restoreSession() {
	if (!getToken()) {
		state.user = null
		return null
	}
	try {
		const data = await api('/api/auth/me')
		state.user = data.user || null
	} catch (error) {
		setToken('')
		state.user = null
	}
	emit()
	return state.user
}

export async function login(credentials) {
	const data = await api('/api/auth/login', { method: 'POST', body: credentials })
	setToken(data.token)
	state.user = data.user
	emit()
	return state.user
}

export async function register(payload) {
	const data = await api('/api/auth/register', { method: 'POST', body: payload })
	setToken(data.token)
	state.user = data.user
	emit()
	return state.user
}

export async function logout() {
	try {
		await api('/api/auth/logout', { method: 'POST' })
	} catch (error) {
		/* сессия могла истечь */
	}
	setToken('')
	state.user = null
	emit()
}

export async function saveProfile(payload) {
	const data = await api('/api/auth/profile', { method: 'POST', body: payload })
	state.user = data.user
	emit()
	return state.user
}

// ── Корзина ─────────────────────────────
export function loadCart() {
	try {
		const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
		state.cart = Array.isArray(raw)
			? raw
					.filter((item) => item && typeof item.id === 'string')
					.map((item) => ({ id: item.id, qty: Math.max(1, Math.min(30, Number(item.qty) || 1)) }))
			: []
	} catch (error) {
		state.cart = []
	}
	return state.cart
}

function persistCart() {
	try {
		localStorage.setItem(CART_KEY, JSON.stringify(state.cart))
	} catch (error) {
		/* ignore */
	}
	emit()
}

export function addToCart(id, qty = 1) {
	const existing = state.cart.find((item) => item.id === id)
	if (existing) existing.qty = Math.min(30, existing.qty + qty)
	else state.cart.push({ id, qty: Math.min(30, Math.max(1, qty)) })
	persistCart()
}

export function setQty(id, qty) {
	const next = Math.max(0, Math.min(30, Number(qty) || 0))
	if (next === 0) return removeFromCart(id)
	const existing = state.cart.find((item) => item.id === id)
	if (existing) existing.qty = next
	persistCart()
}

export function removeFromCart(id) {
	state.cart = state.cart.filter((item) => item.id !== id)
	persistCart()
}

export function clearCart() {
	state.cart = []
	persistCart()
}

export function cartLines() {
	return state.cart
		.map((item) => {
			const dish = findDish(item.id)
			if (!dish) return null
			return { ...item, dish, sum: dish.price * item.qty }
		})
		.filter(Boolean)
}

export function cartCount() {
	return state.cart.reduce((sum, item) => sum + item.qty, 0)
}

export function cartTotals() {
	const subtotal = cartLines().reduce((sum, line) => sum + line.sum, 0)
	const { fee, freeFrom } = state.menu.delivery
	const delivery = subtotal === 0 || subtotal >= freeFrom ? 0 : fee
	return { subtotal, delivery, total: subtotal + delivery, freeFrom, fee }
}

// ── Заказы ──────────────────────────────
export async function createOrder(payload) {
	const items = state.cart.map((item) => ({ id: item.id, qty: item.qty }))
	const data = await api('/api/orders', { method: 'POST', body: { ...payload, items } })
	clearCart()
	return data.order
}

export async function myOrders() {
	const data = await api('/api/orders')
	return data.orders || []
}

export async function getOrder(idOrNumber) {
	const data = await api(`/api/orders/${encodeURIComponent(idOrNumber)}`)
	return data.order
}

export const STATUS_LABELS = {
	new: 'Новый',
	accepted: 'Принят',
	cooking: 'Готовится',
	ready: 'Готов',
	delivering: 'Передан в доставку',
	done: 'Выполнен',
	rejected: 'Отклонён'
}

export const ORDER_FLOW = ['new', 'accepted', 'cooking', 'ready', 'delivering', 'done']

export function escapeHtml(value) {
	return String(value == null ? '' : value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

export function formatDate(iso) {
	if (!iso) return ''
	const date = new Date(iso)
	if (Number.isNaN(date.getTime())) return ''
	return date.toLocaleString('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	})
}
