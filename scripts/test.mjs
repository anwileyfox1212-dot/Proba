// Смок-тесты всех ключевых сценариев: меню, регистрация, вход, заказ,
// отслеживание статуса, админ-панель и её защита.
// Запуск: npm test  (сервер поднимается автоматически на свободном порту)
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.TEST_PORT || 4173)
const BASE = 'http' + '://' + '127.0.0.1' + ':' + PORT

let passed = 0
let failed = 0

function check(name, condition, extra = '') {
	if (condition) {
		passed += 1
		console.log(`  ✓ ${name}`)
	} else {
		failed += 1
		console.error(`  ✖ ${name}${extra ? ` — ${extra}` : ''}`)
	}
}

async function request(pathname, { method = 'GET', body, token } = {}) {
	const headers = {}
	if (token) headers.Authorization = `Bearer ${token}`
	if (body !== undefined) headers['Content-Type'] = 'application/json'
	const response = await fetch(BASE + pathname, {
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
	return { status: response.status, data: payload }
}

async function waitForServer(timeoutMs = 15000) {
	const deadline = Date.now() + timeoutMs
	while (Date.now() < deadline) {
		try {
			const response = await fetch(BASE + '/api/menu')
			if (response.ok) return true
		} catch (error) {
			/* сервер ещё не готов */
		}
		await new Promise((resolve) => setTimeout(resolve, 250))
	}
	return false
}

const server = spawn(process.execPath, [path.join(root, 'server', 'index.js')], {
	cwd: root,
	env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1' },
	stdio: ['ignore', 'pipe', 'pipe']
})
server.stdout.on('data', () => {})
server.stderr.on('data', (chunk) => console.error('[server]', String(chunk).trim()))

function stopServer() {
	if (!server.killed) server.kill()
}

try {
	console.log('─'.repeat(52))
	console.log('КИМ БАО · тесты сценариев')
	console.log('─'.repeat(52))

	const up = await waitForServer()
	check('сервер запустился', up)
	if (!up) throw new Error('сервер не ответил')

	// ── Статика и меню
	const indexPage = await fetch(BASE + '/')
	const indexHtml = await indexPage.text()
	check('главная страница отдаётся', indexPage.ok && indexHtml.includes('КИМ'))
	const spaFallback = await fetch(BASE + '/menu')
	check('SPA-маршрут /menu отдаёт index.html', spaFallback.ok)
	const cssResponse = await fetch(BASE + '/css/style.css')
	check('стили отдаются', cssResponse.ok)

	const menu = await request('/api/menu')
	check('меню загружается', menu.status === 200 && menu.data.dishes.length >= 10)
	check('категории есть', (menu.data.categories || []).length >= 3)
	const dishes = menu.data.dishes

	// ── Регистрация
	const login = `test_${Date.now().toString(36)}`
	const registered = await request('/api/auth/register', {
		method: 'POST',
		body: { login, password: 'test12345', name: 'Тестовый Гость', phone: '+7 900 111-22-33', address: 'ул. Тестовая 1' }
	})
	check('регистрация работает', registered.status === 200 && !!registered.data.token)
	const userToken = registered.data.token

	const duplicate = await request('/api/auth/register', { method: 'POST', body: { login, password: 'test12345' } })
	check('повторный логин отклоняется', duplicate.status === 409)
	const weak = await request('/api/auth/register', { method: 'POST', body: { login: `w${Date.now()}`, password: '12' } })
	check('короткий пароль отклоняется', weak.status === 400)

	// ── Вход
	const relogin = await request('/api/auth/login', { method: 'POST', body: { login, password: 'test12345' } })
	check('вход по логину/паролю', relogin.status === 200 && !!relogin.data.token)
	const badLogin = await request('/api/auth/login', { method: 'POST', body: { login, password: 'wrong-pass' } })
	check('неверный пароль отклоняется', badLogin.status === 401)
	const me = await request('/api/auth/me', { token: userToken })
	check('сессия восстанавливается', me.status === 200 && me.data.user.login === login)
	check('роль нового пользователя — user', me.data.user.role === 'user')

	// ── Профиль
	const profile = await request('/api/auth/profile', {
		method: 'POST',
		token: userToken,
		body: { name: 'Гость КИМ БАО', phone: '+7 900 222-33-44', address: 'ул. Лубянская 12' }
	})
	check('профиль обновляется', profile.status === 200 && profile.data.user.name === 'Гость КИМ БАО')

	// ── Заказ (корзина → оформление)
	const anon = await request('/api/orders', { method: 'POST', body: { items: [{ id: dishes[0].id, qty: 1 }] } })
	check('анонимный заказ запрещён', anon.status === 401)

	const emptyOrder = await request('/api/orders', {
		method: 'POST',
		token: userToken,
		body: { items: [], phone: '+7 900 222-33-44', address: 'ул. Лубянская 12' }
	})
	check('пустая корзина не оформляется', emptyOrder.status === 400)

	const noAddress = await request('/api/orders', {
		method: 'POST',
		token: userToken,
		body: { items: [{ id: dishes[0].id, qty: 1 }], phone: '+7 900 222-33-44', address: '' }
	})
	check('заказ без адреса отклоняется', noAddress.status === 400)

	const created = await request('/api/orders', {
		method: 'POST',
		token: userToken,
		body: {
			items: [
				{ id: dishes[0].id, qty: 2 },
				{ id: dishes[1].id, qty: 1 }
			],
			name: 'Гость КИМ БАО',
			phone: '+7 900 222-33-44',
			address: 'ул. Лубянская 12, кв. 5',
			payment: 'card',
			comment: 'Поострее, пожалуйста'
		}
	})
	const order = created.data.order
	const expectedSubtotal = dishes[0].price * 2 + dishes[1].price
	check('заказ создаётся', created.status === 200 && !!order)
	check('сумма заказа считается верно', order.subtotal === expectedSubtotal, `ожидалось ${expectedSubtotal}`)
	check('итог = блюда + доставка', order.total === order.subtotal + order.delivery)
	check('начальный статус — Новый', order.status === 'new' && order.statusLabel === 'Новый')

	const myOrders = await request('/api/orders', { token: userToken })
	check('история заказов доступна', myOrders.status === 200 && myOrders.data.orders.some((o) => o.id === order.id))
	const byNumber = await request(`/api/orders/${order.number}`, { token: userToken })
	check('отслеживание по номеру заказа', byNumber.status === 200 && byNumber.data.order.id === order.id)

	// ── Защита админ-панели
	const forbiddenOrders = await request('/api/admin/orders', { token: userToken })
	check('обычный пользователь не видит заказы админки', forbiddenOrders.status === 403)
	const forbiddenUsers = await request('/api/admin/users', { token: userToken })
	check('обычный пользователь не видит список клиентов', forbiddenUsers.status === 403)
	const noToken = await request('/api/admin/orders')
	check('без токена админ-API закрыт', noToken.status === 401)

	// ── Администратор
	const adminLogin = await request('/api/auth/login', { method: 'POST', body: { login: 'admin', password: 'admin123' } })
	check('админ входит admin/admin123', adminLogin.status === 200 && adminLogin.data.user.role === 'admin')
	const adminToken = adminLogin.data.token

	const adminOrders = await request('/api/admin/orders', { token: adminToken })
	check('админ видит заказы', adminOrders.status === 200 && adminOrders.data.orders.some((o) => o.id === order.id))
	const adminOrder = adminOrders.data.orders.find((o) => o.id === order.id)
	check('админ видит состав и клиента', adminOrder.items.length === 2 && !!adminOrder.user)

	const flow = ['accepted', 'cooking', 'ready', 'delivering', 'done']
	let flowOk = true
	for (const status of flow) {
		const result = await request(`/api/admin/orders/${order.id}/status`, {
			method: 'POST',
			token: adminToken,
			body: { status }
		})
		if (result.status !== 200 || result.data.order.status !== status) flowOk = false
	}
	check('админ проводит заказ по всем статусам', flowOk)

	const tracked = await request(`/api/orders/${order.id}`, { token: userToken })
	check('клиент видит финальный статус «Выполнен»', tracked.data.order.status === 'done')
	check('история статусов записана', (tracked.data.order.history || []).length === 6)

	const badStatus = await request(`/api/admin/orders/${order.id}/status`, {
		method: 'POST',
		token: adminToken,
		body: { status: 'teleported' }
	})
	check('неизвестный статус отклоняется', badStatus.status === 400)

	// ── Отклонение заказа
	const second = await request('/api/orders', {
		method: 'POST',
		token: userToken,
		body: {
			items: [{ id: dishes[2].id, qty: 1 }],
			phone: '+7 900 222-33-44',
			address: 'ул. Лубянская 12, кв. 5'
		}
	})
	const rejected = await request(`/api/admin/orders/${second.data.order.id}/status`, {
		method: 'POST',
		token: adminToken,
		body: { status: 'rejected', reason: 'Нет блюд в наличии' }
	})
	check(
		'админ отклоняет заказ с причиной',
		rejected.status === 200 && rejected.data.order.status === 'rejected' && rejected.data.order.rejectReason === 'Нет блюд в наличии'
	)

	// ── Пользователи и статистика
	const adminUsers = await request('/api/admin/users', { token: adminToken })
	check('админ видит зарегистрированных пользователей', adminUsers.status === 200 && adminUsers.data.users.some((u) => u.login === login))
	check('в списке пользователей нет хешей паролей', adminUsers.data.users.every((u) => !('passwordHash' in u)))
	const stats = await request('/api/admin/stats', { token: adminToken })
	check('статистика считается', stats.status === 200 && stats.data.totalOrders >= 2)

	// ── Выход
	const loggedOut = await request('/api/auth/logout', { method: 'POST', token: userToken })
	check('выход работает', loggedOut.status === 200)
	const afterLogout = await request('/api/auth/me', { token: userToken })
	check('токен после выхода недействителен', afterLogout.status === 401)

	console.log('─'.repeat(52))
	console.log(`Итог: успешно ${passed}, ошибок ${failed}`)
} catch (error) {
	failed += 1
	console.error('Фатальная ошибка тестов:', error.message)
} finally {
	stopServer()
}

process.exit(failed ? 1 : 0)
