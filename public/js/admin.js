// Панель администратора КИМ БАО.

import { state, api, money, escapeHtml, formatDate, STATUS_LABELS, ORDER_FLOW } from './store.js'
import { toast } from './motion.js'

const go = (path) => window.KIMBAO && window.KIMBAO.go(path)

function nextStatus(status) {
	const index = ORDER_FLOW.indexOf(status)
	if (index < 0 || index >= ORDER_FLOW.length - 1) return null
	return ORDER_FLOW[index + 1]
}

function adminOrderCard(order) {
	const next = nextStatus(order.status)
	const isFinal = order.status === 'done' || order.status === 'rejected'
	return `<article class="order-card order-card--admin" data-reveal data-order="${order.id}">
	<header class="order-card__head">
		<div>
			<h3>№${order.number}</h3>
			<p class="order-card__date">${formatDate(order.createdAt)}</p>
		</div>
		<span class="status status--${order.status}">${STATUS_LABELS[order.status] || order.status}</span>
	</header>
	<p class="muted">${escapeHtml(order.customer.name || 'Без имени')} · ${escapeHtml(order.customer.phone)}<br />${escapeHtml(
		order.customer.address
	)}</p>
	${order.customer.comment ? `<p class="muted">Комментарий: ${escapeHtml(order.customer.comment)}</p>` : ''}
	<ul class="order-card__items">
		${order.items
			.map((item) => `<li><span>${escapeHtml(item.name)} × ${item.qty}</span><b>${money(item.price * item.qty)}</b></li>`)
			.join('')}
	</ul>
	<footer class="order-card__foot">
		<b>${money(order.total)} · ${order.payment === 'card' ? 'карта' : 'наличные'}</b>
		<div class="order-card__buttons">
			${order.status === 'new' ? `<button type="button" class="btn btn--primary btn--sm" data-accept="${order.id}">Принять</button>` : ''}
			${order.status === 'new' ? `<button type="button" class="btn btn--ghost btn--sm" data-reject="${order.id}">Отклонить</button>` : ''}
			${
				!isFinal && order.status !== 'new' && next
					? `<button type="button" class="btn btn--primary btn--sm" data-next="${order.id}" data-status="${next}">${STATUS_LABELS[next]}</button>`
					: ''
			}
		</div>
	</footer>
</article>`
}

export async function adminView() {
	if (!state.user || state.user.role !== 'admin') {
		return {
			html: `<section class="section shell empty-state" data-reveal>
	<h1>Доступ закрыт</h1>
	<p>Эта страница доступна только администратору ресторана.</p>
	<button type="button" class="btn btn--primary" data-go="/auth">Войти как админ</button>
</section>`
		}
	}

	let orders = []
	let users = []
	let stats = {}
	try {
		const [ordersData, usersData, statsData] = await Promise.all([
			api('/api/admin/orders'),
			api('/api/admin/users'),
			api('/api/admin/stats')
		])
		orders = ordersData.orders || []
		users = usersData.users || []
		stats = statsData.stats || statsData || {}
	} catch (error) {
		return {
			html: `<section class="section shell empty-state" data-reveal><h1>Ошибка</h1><p>${escapeHtml(
				error.message
			)}</p></section>`
		}
	}

	const active = orders.filter((order) => !['done', 'rejected'].includes(order.status))
	const history = orders.filter((order) => ['done', 'rejected'].includes(order.status))

	const html = `<section class="page-head shell">
	<p class="page-head__eyebrow" data-reveal>Панель управления</p>
	<h1 class="page-head__title" data-reveal>Администратор</h1>
</section>
<section class="section shell admin">
	<div class="admin-stats" data-stagger="70">
		<div class="admin-stat" data-reveal><b>${stats.newOrders != null ? stats.newOrders : active.filter((o) => o.status === 'new').length}</b><span>новых заказов</span></div>
		<div class="admin-stat" data-reveal><b>${stats.totalOrders != null ? stats.totalOrders : orders.length}</b><span>всего заказов</span></div>
		<div class="admin-stat" data-reveal><b>${stats.users != null ? stats.users : users.length}</b><span>пользователей</span></div>
		<div class="admin-stat" data-reveal><b>${money(stats.revenue || history.filter((o) => o.status === 'done').reduce((sum, o) => sum + o.total, 0))}</b><span>выручка</span></div>
	</div>
	<div class="tabs tabs--admin" role="tablist">
		<button type="button" class="tab" data-atab="active" aria-selected="true">Активные (${active.length})</button>
		<button type="button" class="tab" data-atab="history" aria-selected="false">История (${history.length})</button>
		<button type="button" class="tab" data-atab="users" aria-selected="false">Пользователи (${users.length})</button>
	</div>
	<div class="admin-panel" data-apanel="active">
		<div class="orders orders--admin" data-stagger="70">
			${active.length ? active.map(adminOrderCard).join('') : '<p class="muted" data-reveal>Новых заказов нет.</p>'}
		</div>
	</div>
	<div class="admin-panel" data-apanel="history" hidden>
		<div class="orders orders--admin" data-stagger="70">
			${history.length ? history.map(adminOrderCard).join('') : '<p class="muted">История пуста.</p>'}
		</div>
	</div>
	<div class="admin-panel" data-apanel="users" hidden>
		<table class="admin-table">
			<thead><tr><th>Логин</th><th>Имя</th><th>Телефон</th><th>Роль</th><th>Регистрация</th></tr></thead>
			<tbody>
				${users
					.map(
						(user) =>
							`<tr><td>${escapeHtml(user.login)}</td><td>${escapeHtml(user.name || '')}</td><td>${escapeHtml(
								user.phone || ''
							)}</td><td>${user.role === 'admin' ? 'Админ' : 'Клиент'}</td><td>${formatDate(user.createdAt)}</td></tr>`
					)
					.join('')}
			</tbody>
		</table>
	</div>
</section>`

	return {
		html,
		mount(root) {
			root.querySelectorAll('[data-atab]').forEach((tab) => {
				tab.addEventListener('click', () => {
					const key = tab.dataset.atab
					root.querySelectorAll('[data-atab]').forEach((other) =>
						other.setAttribute('aria-selected', String(other === tab))
					)
					root.querySelectorAll('[data-apanel]').forEach((panel) => {
						panel.hidden = panel.dataset.apanel !== key
					})
				})
			})

			const setStatus = async (id, status, reason) => {
				try {
					await api(`/api/admin/orders/${id}/status`, { method: 'POST', body: { status, reason } })
					toast(`Статус: ${STATUS_LABELS[status]}`, 'success')
					go('/admin')
				} catch (error) {
					toast(error.message, 'error')
				}
			}

			root.querySelectorAll('[data-accept]').forEach((button) => {
				button.addEventListener('click', () => setStatus(button.dataset.accept, 'accepted'))
			})
			root.querySelectorAll('[data-reject]').forEach((button) => {
				button.addEventListener('click', () => {
					const reason = window.prompt('Причина отказа?', 'Нет продуктов') || ''
					setStatus(button.dataset.reject, 'rejected', reason)
				})
			})
			root.querySelectorAll('[data-next]').forEach((button) => {
				button.addEventListener('click', () => setStatus(button.dataset.next, button.dataset.status))
			})
		}
	}
}
