// Точка входа: роутер, шапка, корзина-drawer, preloader.

import {
	state,
	subscribe,
	money,
	loadMenu,
	loadCart,
	restoreSession,
	cartLines,
	cartCount,
	cartTotals,
	setQty,
	removeFromCart,
	escapeHtml
} from './store.js'
import { refreshMotion, curtain, runPreloader, toast } from './motion.js'
import { homeView, menuView, checkoutView, accountView, authView, orderView, notFoundView } from './views.js'
import { adminView } from './admin.js'

const app = document.getElementById('app')
const cartBtn = document.getElementById('cartBtn')
const cartCountNode = document.getElementById('cartCount')
const cartDrawer = document.getElementById('cartDrawer')
const cartBody = document.getElementById('cartBody')
const cartFoot = document.getElementById('cartFoot')
const backdrop = document.getElementById('drawerBackdrop')
const authBtn = document.getElementById('authBtn')
const adminLink = document.getElementById('adminLink')
const burger = document.getElementById('burger')
const siteNav = document.getElementById('siteNav')

let rendering = false

function matchRoute(path) {
	if (path === '/' || path === '') return { view: homeView, params: {} }
	if (path === '/menu') return { view: menuView, params: {} }
	if (path === '/checkout') return { view: checkoutView, params: {} }
	if (path === '/account') return { view: accountView, params: {} }
	if (path === '/auth') return { view: authView, params: {} }
	if (path === '/admin') return { view: adminView, params: {} }
	const order = path.match(/^\/order\/([\w-]+)$/)
	if (order) return { view: orderView, params: { id: order[1] } }
	return { view: notFoundView, params: {} }
}

async function render(path, { animate = true } = {}) {
	if (rendering) return
	rendering = true
	const { view, params } = matchRoute(path)
	try {
		if (animate) await curtain('in')
		const result = await view(params)
		app.innerHTML = result.html
		window.scrollTo({ top: 0, behavior: 'auto' })
		if (typeof result.mount === 'function') result.mount(app)
		refreshMotion(app)
		syncNav(path)
		if (animate) await curtain('out')
	} catch (error) {
		app.innerHTML = `<section class="section shell empty-state"><h1>Что-то пошло не так</h1><p>${escapeHtml(
			error.message
		)}</p></section>`
		refreshMotion(app)
	} finally {
		rendering = false
	}
}

export function go(path) {
	if (window.location.pathname === path) {
		render(path)
		return
	}
	history.pushState({}, '', path)
	closeCart()
	closeNav()
	render(path)
}

function syncNav(path) {
	document.querySelectorAll('[data-nav]').forEach((link) => {
		link.setAttribute('aria-current', link.dataset.nav === path ? 'page' : 'false')
	})
	const isAdmin = Boolean(state.user && state.user.role === 'admin')
	if (adminLink) adminLink.hidden = !isAdmin
	if (authBtn) authBtn.textContent = state.user ? state.user.name || state.user.login : 'Войти'
}

// ── Корзина ─────────────────────────────
function renderCart() {
	const lines = cartLines()
	const totals = cartTotals()
	if (cartCountNode) {
		cartCountNode.textContent = String(cartCount())
		cartCountNode.hidden = cartCount() === 0
	}
	if (!cartBody || !cartFoot) return
	if (!lines.length) {
		cartBody.innerHTML = '<p class="cart-empty">Корзина пуста. Самое время выбрать бао.</p>'
		cartFoot.innerHTML = '<button type="button" class="btn btn--primary btn--lg" data-go="/menu">В меню</button>'
		return
	}
	cartBody.innerHTML = lines
		.map(
			(line) => `<div class="cart-line" data-line="${line.id}">
		<div class="cart-line__info">
			<h4>${escapeHtml(line.dish.name)}</h4>
			<p>${money(line.dish.price)} · ${escapeHtml(line.dish.weight || '')}</p>
		</div>
		<div class="cart-line__controls">
			<button type="button" class="qty__btn" data-dec="${line.id}" aria-label="Меньше">−</button>
			<span class="cart-line__qty">${line.qty}</span>
			<button type="button" class="qty__btn" data-inc="${line.id}" aria-label="Больше">+</button>
		</div>
		<b class="cart-line__sum">${money(line.sum)}</b>
		<button type="button" class="cart-line__remove" data-remove="${line.id}" aria-label="Удалить">×</button>
	</div>`
		)
		.join('')
	cartFoot.innerHTML = `<div class="summary-row"><span>Сумма</span><b>${money(totals.subtotal)}</b></div>
<div class="summary-row"><span>Доставка</span><b>${totals.delivery ? money(totals.delivery) : 'бесплатно'}</b></div>
<div class="summary-row summary-row--total"><span>Итого</span><b>${money(totals.total)}</b></div>
<button type="button" class="btn btn--primary btn--lg" data-go="/checkout">Оформить заказ</button>`
}

function openCart() {
	if (!cartDrawer) return
	cartDrawer.dataset.open = 'true'
	if (backdrop) backdrop.dataset.open = 'true'
	document.body.dataset.lock = 'true'
}

function closeCart() {
	if (!cartDrawer) return
	cartDrawer.dataset.open = 'false'
	if (backdrop) backdrop.dataset.open = 'false'
	document.body.dataset.lock = 'false'
}

function closeNav() {
	if (siteNav) siteNav.dataset.open = 'false'
	if (burger) burger.setAttribute('aria-expanded', 'false')
}

// ── Глобальные обработчики ───────────────────
document.addEventListener('click', (event) => {
	const navLink = event.target.closest('[data-nav]')
	if (navLink) {
		event.preventDefault()
		go(navLink.dataset.nav)
		return
	}
	const goBtn = event.target.closest('[data-go]')
	if (goBtn) {
		event.preventDefault()
		go(goBtn.dataset.go)
		return
	}
	const inc = event.target.closest('[data-inc]')
	if (inc) {
		const line = cartLines().find((item) => item.id === inc.dataset.inc)
		if (line) setQty(line.id, line.qty + 1)
		return
	}
	const dec = event.target.closest('[data-dec]')
	if (dec) {
		const line = cartLines().find((item) => item.id === dec.dataset.dec)
		if (line) setQty(line.id, line.qty - 1)
		return
	}
	const remove = event.target.closest('[data-remove]')
	if (remove) {
		removeFromCart(remove.dataset.remove)
		toast('Блюдо удалено из корзины')
	}
})

if (cartBtn) cartBtn.addEventListener('click', openCart)
const cartClose = document.getElementById('cartClose')
if (cartClose) cartClose.addEventListener('click', closeCart)
if (backdrop)
	backdrop.addEventListener('click', () => {
		closeCart()
		closeNav()
	})
document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
		closeCart()
		closeNav()
	}
})

if (authBtn)
	authBtn.addEventListener('click', () => {
		go(state.user ? (state.user.role === 'admin' ? '/admin' : '/account') : '/auth')
	})

if (burger)
	burger.addEventListener('click', () => {
		const open = siteNav.dataset.open === 'true'
		siteNav.dataset.open = open ? 'false' : 'true'
		burger.setAttribute('aria-expanded', String(!open))
		if (backdrop) backdrop.dataset.open = open ? 'false' : 'true'
	})

window.addEventListener('popstate', () => render(window.location.pathname, { animate: false }))

subscribe(() => {
	renderCart()
	syncNav(window.location.pathname)
})

window.KIMBAO = { go, openCart, closeCart, renderCart }

// ── Старт ───────────────────────────────
async function boot() {
	document.body.dataset.loading = 'true'
	loadCart()
	const preloading = runPreloader()
	try {
		await loadMenu()
	} catch (error) {
		toast('Не удалось загрузить меню', 'error')
	}
	await restoreSession()
	renderCart()
	await render(window.location.pathname, { animate: false })
	state.ready = true
	await preloading
}

boot()
