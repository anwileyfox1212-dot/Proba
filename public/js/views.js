// Экраны клиентской части КИМ БАО.
// Каждая view возвращает { html, mount? }.

import {
	state,
	money,
	loadMenu,
	findDish,
	addToCart,
	cartLines,
	cartTotals,
	createOrder,
	myOrders,
	getOrder,
	login,
	register,
	saveProfile,
	logout,
	escapeHtml,
	formatDate,
	STATUS_LABELS,
	ORDER_FLOW
} from './store.js'
import { dishArt, heroArt, FLOATING_GLYPHS } from './art.js'
import { kinetic, flyToCart, toast } from './motion.js'

const go = (path) => window.KIMBAO && window.KIMBAO.go(path)
export const openCart = () => window.KIMBAO && window.KIMBAO.openCart()

function tagsHtml(dish) {
	const map = { 'хит': 'hit', 'острое': 'spicy', 'веган': 'veg' }
	return (dish.tags || [])
		.map((tag) => `<span class="tag tag--${map[tag] || 'plain'}">${escapeHtml(tag)}</span>`)
		.join('')
}

export function dishCard(dish, index = 0) {
	return `<article class="dish-card" data-reveal data-tilt data-dish="${dish.id}" data-delay="${Math.min(index * 60, 420)}">
	<div class="dish-card__media" data-art="${dish.id}">${dishArt(dish)}</div>
	<div class="dish-card__body">
		<div class="dish-card__tags">${tagsHtml(dish)}</div>
		<h3 class="dish-card__title">${escapeHtml(dish.name)}</h3>
		<p class="dish-card__desc">${escapeHtml(dish.description)}</p>
		<p class="dish-card__composition"><b>Состав:</b> ${escapeHtml(dish.composition)}</p>
		<div class="dish-card__meta">
			<span class="dish-card__weight">${escapeHtml(dish.weight || '')}</span>
			<span class="dish-card__price">${money(dish.price)}</span>
		</div>
		<div class="dish-card__actions">
			<div class="qty" data-qty="${dish.id}">
				<button type="button" class="qty__btn" data-qty-dec aria-label="Меньше">−</button>
				<span class="qty__value" data-qty-value>1</span>
				<button type="button" class="qty__btn" data-qty-inc aria-label="Больше">+</button>
			</div>
			<button type="button" class="btn btn--primary" data-add="${dish.id}">В корзину</button>
		</div>
	</div>
</article>`
}

function bindDishGrid(root) {
	root.querySelectorAll('[data-qty]').forEach((box) => {
		const value = box.querySelector('[data-qty-value]')
		box.querySelector('[data-qty-dec]').addEventListener('click', () => {
			value.textContent = String(Math.max(1, Number(value.textContent) - 1))
		})
		box.querySelector('[data-qty-inc]').addEventListener('click', () => {
			value.textContent = String(Math.min(30, Number(value.textContent) + 1))
		})
	})
	root.querySelectorAll('[data-add]').forEach((button) => {
		button.addEventListener('click', () => {
			const id = button.dataset.add
			const dish = findDish(id)
			if (!dish) return
			const card = button.closest('.dish-card')
			const valueNode = card && card.querySelector('[data-qty-value]')
			const qty = valueNode ? Number(valueNode.textContent) || 1 : 1
			addToCart(id, qty)
			if (card) flyToCart(card.querySelector('.dish-card__media'))
			toast(`${dish.name} — в корзине`, 'success')
			if (valueNode) valueNode.textContent = '1'
		})
	})
}

function statusBadge(order) {
	return `<span class="status status--${order.status}">${STATUS_LABELS[order.status] || order.status}</span>`
}

function orderCard(order) {
	return `<article class="order-card" data-reveal data-order="${order.id}">
	<header class="order-card__head">
		<div>
			<h3>№${order.number}</h3>
			<p class="order-card__date">${formatDate(order.createdAt)}</p>
		</div>
		${statusBadge(order)}
	</header>
	<ul class="order-card__items">
		${order.items
			.map((item) => `<li><span>${escapeHtml(item.name)} × ${item.qty}</span><b>${money(item.price * item.qty)}</b></li>`)
			.join('')}
	</ul>
	<footer class="order-card__foot">
		<b>${money(order.total)}</b>
		<button type="button" class="btn btn--ghost btn--sm" data-go="/order/${order.id}">Подробнее</button>
	</footer>
</article>`
}

// ── Главная ─────────────────────
export async function homeView() {
	const menu = await loadMenu()
	const hits = menu.dishes.filter((dish) => (dish.tags || []).includes('хит')).slice(0, 6)
	const popular = hits.length ? hits : menu.dishes.slice(0, 6)
	const floaties = menu.dishes.slice(0, 4)

	const html = `<section class="hero">
	<div class="hero__bg" data-parallax="0.06" data-parallax-pointer>${heroArt()}</div>
	<div class="hero__glyphs" aria-hidden="true">
		${FLOATING_GLYPHS.map(
			(glyph, index) =>
				`<span class="floaty floaty--glyph" data-parallax="${(0.04 + index * 0.02).toFixed(2)}" data-parallax-pointer style="--i:${index}">${glyph}</span>`
		).join('')}
		${floaties
			.map(
				(dish, index) =>
					`<span class="floaty floaty--dish" data-parallax="${(0.08 + index * 0.03).toFixed(2)}" data-parallax-tilt data-parallax-pointer style="--i:${index}">${dishArt(dish)}</span>`
			)
			.join('')}
	</div>
	<div class="shell hero__grid">
		<div class="hero__copy">
			<p class="hero__eyebrow">김 Корейский street food · Москва</p>
			<h1 class="hero__title kinetic">${kinetic('КИМ БАО')}<span class="accent">${kinetic('жар и пар', 0.4)}</span></h1>
			<p class="hero__lead" data-reveal>Паровые бао, токпокки и лапша ручной работы. Готовим на открытом огне и везём горячим за 45 минут.</p>
			<div class="hero__cta" data-reveal data-delay="120">
				<button type="button" class="btn btn--primary btn--lg" data-go="/menu">Собрать заказ</button>
				<button type="button" class="btn btn--ghost btn--lg" data-go="/account">Личный кабинет</button>
			</div>
			<dl class="hero__stats" data-reveal data-delay="220" data-stagger="90">
				<div data-reveal><dt>45 мин</dt><dd>средняя доставка</dd></div>
				<div data-reveal><dt>12</dt><dd>позиций в меню</dd></div>
				<div data-reveal><dt>0 ₽</dt><dd>доставка от ${money(menu.delivery.freeFrom)}</dd></div>
			</dl>
		</div>
		<div class="hero__plate" data-parallax="0.12" data-parallax-tilt data-parallax-pointer>
			${dishArt(menu.dishes[0] || {})}
		</div>
	</div>
	<div class="hero__scroll" aria-hidden="true"><span></span>листайте</div>
</section>

<section class="marquee" aria-hidden="true">
	<div class="marquee__track">${Array.from({ length: 2 })
		.map(
			() =>
				'<span>БАО НА ПАРУ • ТОКПОККИ • КОРЕЙСКИЕ КРЫЛЬЯ • ЧАПЧХЭ • РАМЬОН • ХОТТОК • </span>'
		)
		.join('')}</div>
</section>

<section class="section shell">
	<header class="section__head" data-reveal>
		<h2 class="section__title">Хиты кухни</h2>
		<p class="section__sub">Начните с того, что заказывают чаще всего</p>
	</header>
	<div class="dish-grid" id="dishGrid" data-stagger="80">
		${popular.map((dish, index) => dishCard(dish, index)).join('')}
	</div>
	<div class="section__foot" data-reveal>
		<button type="button" class="btn btn--ghost" data-go="/menu">Всё меню</button>
	</div>
</section>

<section class="section section--steps shell">
	<header class="section__head" data-reveal>
		<h2 class="section__title">Как это работает</h2>
	</header>
	<div class="steps" data-stagger="110">
		<div class="step" data-reveal><span class="step__num">01</span><h3>Соберите заказ</h3><p>Выберите блюда и количество в меню.</p></div>
		<div class="step" data-reveal><span class="step__num">02</span><h3>Оформите</h3><p>Адрес, телефон и способ оплаты.</p></div>
		<div class="step" data-reveal><span class="step__num">03</span><h3>Следите</h3><p>Статус обновляется в личном кабинете.</p></div>
	</div>
</section>

<section class="cta shell" data-reveal>
	<div class="cta__inner" data-parallax="0.04">
		<h2>Голодны прямо сейчас?</h2>
		<p>Кухня работает ежедневно с 11:00 до 23:00.</p>
		<button type="button" class="btn btn--primary btn--lg" data-go="/menu">В меню</button>
	</div>
</section>`

	return {
		html,
		mount(root) {
			bindDishGrid(root)
		}
	}
}

// ── Меню ───────────────────────
export async function menuView() {
	const menu = await loadMenu()
	const chips = [{ id: 'all', title: 'Всё меню' }, ...menu.categories]

	const html = `<section class="page-head shell">
	<p class="page-head__eyebrow" data-reveal>Меню</p>
	<h1 class="page-head__title kinetic" data-reveal>${kinetic('ВКУС УЛИЦЫ')}</h1>
	<p class="page-head__lead" data-reveal data-delay="90">12 позиций: бао на пару, уличная классика, лапша и напитки.</p>
</section>
<section class="section shell">
	<div class="menu-toolbar" data-reveal>
		<label class="search">
			<input id="dishSearch" type="search" placeholder="Поиск по блюдам и составу" autocomplete="off" />
		</label>
		<div class="chips" id="catChips">
			${chips
				.map(
					(cat, index) =>
						`<button type="button" class="chip" data-cat="${cat.id}" aria-pressed="${index === 0}">${escapeHtml(
							cat.title
						)}</button>`
				)
				.join('')}
		</div>
	</div>
	<p class="menu-empty" id="menuEmpty" hidden>Ничего не нашлось. Попробуйте другой запрос.</p>
	<div class="dish-grid" id="dishGrid" data-stagger="70">
		${menu.dishes.map((dish, index) => dishCard(dish, index)).join('')}
	</div>
</section>`

	return {
		html,
		mount(root) {
			bindDishGrid(root)
			const grid = root.querySelector('#dishGrid')
			const empty = root.querySelector('#menuEmpty')
			const search = root.querySelector('#dishSearch')
			let category = 'all'

			const apply = () => {
				const query = (search.value || '').trim().toLowerCase()
				let visible = 0
				grid.querySelectorAll('.dish-card').forEach((card) => {
					const dish = findDish(card.dataset.dish)
					if (!dish) return
					const byCat = category === 'all' || dish.category === category
					const haystack = `${dish.name} ${dish.description} ${dish.composition} ${(dish.tags || []).join(' ')}`.toLowerCase()
					const byQuery = !query || haystack.includes(query)
					const show = byCat && byQuery
					card.hidden = !show
					if (show) visible += 1
				})
				empty.hidden = visible > 0
			}

			search.addEventListener('input', apply)
			root.querySelectorAll('[data-cat]').forEach((chip) => {
				chip.addEventListener('click', () => {
					category = chip.dataset.cat
					root.querySelectorAll('[data-cat]').forEach((other) => {
						other.setAttribute('aria-pressed', String(other === chip))
					})
					apply()
				})
			})
		}
	}
}

// ── Оформление ──────────────────
export async function checkoutView() {
	await loadMenu()
	const lines = cartLines()
	const totals = cartTotals()
	const user = state.user

	if (!lines.length) {
		return {
			html: `<section class="section shell empty-state" data-reveal>
	<h1>Корзина пуста</h1>
	<p>Добавьте блюда из меню, чтобы оформить заказ.</p>
	<button type="button" class="btn btn--primary" data-go="/menu">Перейти в меню</button>
</section>`
		}
	}

	const html = `<section class="page-head shell">
	<p class="page-head__eyebrow" data-reveal>Оформление</p>
	<h1 class="page-head__title kinetic" data-reveal>${kinetic('ЗАКАЗ')}</h1>
</section>
<section class="section shell checkout">
	<form class="card checkout__form" id="checkoutForm" data-reveal novalidate>
		<h2 class="card__title">Контакты и доставка</h2>
		<label class="field"><span>Имя</span><input name="name" value="${escapeHtml(
			(user && user.name) || ''
		)}" placeholder="Как к вам обращаться" /></label>
		<label class="field"><span>Телефон *</span><input name="phone" value="${escapeHtml(
			(user && user.phone) || ''
		)}" placeholder="+7 900 000-00-00" /></label>
		<label class="field"><span>Адрес доставки *</span><input name="address" value="${escapeHtml(
			(user && user.address) || ''
		)}" placeholder="Улица, дом, квартира" /></label>
		<label class="field"><span>Комментарий</span><textarea name="comment" rows="3" placeholder="Пожелания к заказу"></textarea></label>
		<fieldset class="field field--radio">
			<legend>Оплата</legend>
			<label><input type="radio" name="payment" value="cash" checked /> Наличными курьеру</label>
			<label><input type="radio" name="payment" value="card" /> Картой курьеру</label>
		</fieldset>
		<p class="form-error" id="checkoutError" hidden></p>
		<button type="submit" class="btn btn--primary btn--lg">Оформить заказ · ${money(totals.total)}</button>
		${
			user
				? ''
				: '<p class="hint">Заказ можно оформить только после входа. <button type="button" class="link" data-go="/auth">Войти или зарегистрироваться</button></p>'
		}
	</form>
	<aside class="card checkout__summary" data-reveal data-delay="90">
		<h2 class="card__title">Ваш заказ</h2>
		<ul class="summary-list">
			${lines
				.map(
					(line) =>
						`<li><span>${escapeHtml(line.dish.name)} × ${line.qty}</span><b>${money(line.sum)}</b></li>`
				)
				.join('')}
		</ul>
		<div class="summary-row"><span>Сумма</span><b>${money(totals.subtotal)}</b></div>
		<div class="summary-row"><span>Доставка</span><b>${totals.delivery ? money(totals.delivery) : 'бесплатно'}</b></div>
		<div class="summary-row summary-row--total"><span>Итого</span><b>${money(totals.total)}</b></div>
	</aside>
</section>`

	return {
		html,
		mount(root) {
			const form = root.querySelector('#checkoutForm')
			const error = root.querySelector('#checkoutError')
			form.addEventListener('submit', async (event) => {
				event.preventDefault()
				error.hidden = true
				const data = new FormData(form)
				const payload = {
					name: String(data.get('name') || '').trim(),
					phone: String(data.get('phone') || '').trim(),
					address: String(data.get('address') || '').trim(),
					comment: String(data.get('comment') || '').trim(),
					payment: String(data.get('payment') || 'cash')
				}
				const submit = form.querySelector('[type="submit"]')
				submit.disabled = true
				try {
					const order = await createOrder(payload)
					toast(`Заказ №${order.number} принят в работу`, 'success')
					go(`/order/${order.id}`)
				} catch (err) {
					submit.disabled = false
					error.hidden = false
					error.textContent = err.message
					if (err.status === 401) go('/auth')
				}
			})
		}
	}
}

// ── Авторизация ──────────────────
export async function authView() {
	const html = `<section class="page-head shell">
	<p class="page-head__eyebrow" data-reveal>Кабинет</p>
	<h1 class="page-head__title kinetic" data-reveal>${kinetic('ВХОД')}</h1>
</section>
<section class="section shell auth">
	<div class="card auth__card" data-reveal>
		<div class="tabs" role="tablist">
			<button type="button" class="tab" data-tab="login" aria-selected="true">Войти</button>
			<button type="button" class="tab" data-tab="register" aria-selected="false">Регистрация</button>
		</div>
		<form class="auth__form" id="loginForm" novalidate>
			<label class="field"><span>Логин</span><input id="loginLogin" name="login" autocomplete="username" placeholder="например, kimfan" /></label>
			<label class="field"><span>Пароль</span><input id="loginPassword" name="password" type="password" autocomplete="current-password" placeholder="минимум 5 символов" /></label>
			<p class="form-error" id="loginError" hidden></p>
			<button type="submit" class="btn btn--primary btn--lg">Войти</button>
		</form>
		<form class="auth__form" id="registerForm" hidden novalidate>
			<label class="field"><span>Логин *</span><input id="regLogin" name="login" autocomplete="username" placeholder="латиница, от 3 символов" /></label>
			<label class="field"><span>Пароль *</span><input id="regPassword" name="password" type="password" autocomplete="new-password" placeholder="от 5 символов" /></label>
			<label class="field"><span>Имя</span><input id="regName" name="name" placeholder="Как к вам обращаться" /></label>
			<label class="field"><span>Телефон</span><input id="regPhone" name="phone" placeholder="+7 900 000-00-00" /></label>
			<label class="field"><span>Адрес</span><input id="regAddress" name="address" placeholder="Улица, дом, квартира" /></label>
			<p class="form-error" id="registerError" hidden></p>
			<button type="submit" class="btn btn--primary btn--lg">Зарегистрироваться</button>
		</form>
	</div>
	<aside class="card auth__aside" data-reveal data-delay="90">
		<h2 class="card__title">Зачем аккаунт</h2>
		<ul class="bullets">
			<li>Сохранённые адрес и телефон — заказ в два клика</li>
			<li>Отслеживание статуса от «Новый» до «Выполнен»</li>
			<li>История всех заказов</li>
		</ul>
		<p class="muted">Администратор входит тем же формой и попадает в панель управления.</p>
	</aside>
</section>`

	return {
		html,
		mount(root) {
			const loginForm = root.querySelector('#loginForm')
			const registerForm = root.querySelector('#registerForm')
			const loginError = root.querySelector('#loginError')
			const registerError = root.querySelector('#registerError')

			root.querySelectorAll('[data-tab]').forEach((tab) => {
				tab.addEventListener('click', () => {
					const key = tab.dataset.tab
					root.querySelectorAll('[data-tab]').forEach((other) =>
						other.setAttribute('aria-selected', String(other === tab))
					)
					loginForm.hidden = key !== 'login'
					registerForm.hidden = key !== 'register'
				})
			})

			const afterAuth = (user) => {
				toast(`Добро пожаловать, ${user.name || user.login}!`, 'success')
				go(user.role === 'admin' ? '/admin' : '/account')
			}

			loginForm.addEventListener('submit', async (event) => {
				event.preventDefault()
				loginError.hidden = true
				const data = new FormData(loginForm)
				try {
					const user = await login(String(data.get('login') || '').trim(), String(data.get('password') || ''))
					afterAuth(user)
				} catch (err) {
					loginError.hidden = false
					loginError.textContent = err.message
				}
			})

			registerForm.addEventListener('submit', async (event) => {
				event.preventDefault()
				registerError.hidden = true
				const data = new FormData(registerForm)
				try {
					const user = await register({
						login: String(data.get('login') || '').trim(),
						password: String(data.get('password') || ''),
						name: String(data.get('name') || '').trim(),
						phone: String(data.get('phone') || '').trim(),
						address: String(data.get('address') || '').trim()
					})
					afterAuth(user)
				} catch (err) {
					registerError.hidden = false
					registerError.textContent = err.message
				}
			})
		}
	}
}

// ── Личный кабинет ───────────────
export async function accountView() {
	if (!state.user) {
		return {
			html: `<section class="section shell empty-state" data-reveal>
	<h1>Войдите в аккаунт</h1>
	<p>Личный кабинет доступен после входа или регистрации.</p>
	<button type="button" class="btn btn--primary" data-go="/auth">Войти</button>
</section>`
		}
	}

	let orders = []
	try {
		orders = await myOrders()
	} catch (error) {
		orders = []
	}
	const active = orders.filter((order) => !['done', 'rejected'].includes(order.status))
	const history = orders.filter((order) => ['done', 'rejected'].includes(order.status))
	const user = state.user

	const html = `<section class="page-head shell">
	<p class="page-head__eyebrow" data-reveal>Личный кабинет</p>
	<h1 class="page-head__title kinetic" data-reveal>${kinetic(escapeHtml(user.name || user.login))}</h1>
</section>
<section class="section shell account">
	<form class="card account__profile" id="profileForm" data-reveal novalidate>
		<h2 class="card__title">Профиль</h2>
		<p class="account__login muted">Логин: <b>${escapeHtml(user.login)}</b></p>
		<label class="field"><span>Имя</span><input name="name" value="${escapeHtml(user.name || '')}" /></label>
		<label class="field"><span>Телефон</span><input name="phone" value="${escapeHtml(user.phone || '')}" /></label>
		<label class="field"><span>Адрес</span><input name="address" value="${escapeHtml(user.address || '')}" /></label>
		<div class="account__actions">
			<button type="submit" class="btn btn--primary">Сохранить</button>
			<button type="button" class="btn btn--ghost" id="logoutBtn">Выйти</button>
		</div>
	</form>
	<div class="account__orders">
		<h2 class="section__title section__title--sm" data-reveal>Активные заказы</h2>
		<div class="orders" data-stagger="70">
			${active.length ? active.map(orderCard).join('') : '<p class="muted" data-reveal>Сейчас активных заказов нет.</p>'}
		</div>
		<h2 class="section__title section__title--sm" data-reveal>История заказов</h2>
		<div class="orders history" data-stagger="70">
			${history.length ? history.map(orderCard).join('') : '<p class="muted" data-reveal>Завершённых заказов пока нет.</p>'}
		</div>
	</div>
</section>`

	return {
		html,
		mount(root) {
			const form = root.querySelector('#profileForm')
			form.addEventListener('submit', async (event) => {
				event.preventDefault()
				const data = new FormData(form)
				try {
					await saveProfile({
						name: String(data.get('name') || '').trim(),
						phone: String(data.get('phone') || '').trim(),
						address: String(data.get('address') || '').trim()
					})
					toast('Профиль сохранён', 'success')
				} catch (error) {
					toast(error.message, 'error')
				}
			})
			const logoutBtn = root.querySelector('#logoutBtn')
			logoutBtn.addEventListener('click', async () => {
				await logout()
				toast('Вы вышли из аккаунта')
				go('/')
			})
		}
	}
}

// ── Страница заказа ──────────────
function trackHtml(order) {
	const currentIndex = ORDER_FLOW.indexOf(order.status)
	if (order.status === 'rejected') {
		return `<p class="status status--rejected">Заказ отклонён${
			order.rejectReason ? `: ${escapeHtml(order.rejectReason)}` : ''
		}</p>`
	}
	return `<div class="track" data-stagger="80">
		${ORDER_FLOW.map(
			(status, index) =>
				`<div class="track__step" data-reveal data-done="${index <= currentIndex}"><span class="track__dot"></span>${STATUS_LABELS[status]}</div>`
		).join('')}
	</div>`
}

export async function orderView(params = {}) {
	if (!state.user) {
		return {
			html: `<section class="section shell empty-state" data-reveal>
	<h1>Войдите в аккаунт</h1>
	<p>Заказы видны только авторизованным клиентам.</p>
	<button type="button" class="btn btn--primary" data-go="/auth">Войти</button>
</section>`
		}
	}

	let order
	try {
		order = await getOrder(params.id)
	} catch (error) {
		return {
			html: `<section class="section shell empty-state" data-reveal>
	<h1>Заказ не найден</h1>
	<p>${escapeHtml(error.message)}</p>
	<button type="button" class="btn btn--primary" data-go="/account">В личный кабинет</button>
</section>`
		}
	}

	const html = `<section class="page-head shell">
	<p class="page-head__eyebrow" data-reveal>Заказ №${order.number}</p>
	<h1 class="page-head__title kinetic" data-reveal>${kinetic(STATUS_LABELS[order.status] || order.status)}</h1>
	<p class="page-head__lead" data-reveal>Создан ${formatDate(order.createdAt)}</p>
</section>
<section class="section shell order-page">
	<div class="card" data-reveal>
		<h2 class="card__title">Статус заказа</h2>
		${trackHtml(order)}
		<button type="button" class="btn btn--ghost btn--sm" id="refreshOrder">Обновить</button>
	</div>
	<div class="card" data-reveal data-delay="90">
		<h2 class="card__title">Состав</h2>
		<ul class="summary-list">
			${order.items
				.map(
					(item) =>
						`<li><span>${escapeHtml(item.name)} × ${item.qty}</span><b>${money(item.price * item.qty)}</b></li>`
				)
				.join('')}
		</ul>
		<div class="summary-row"><span>Сумма</span><b>${money(order.subtotal)}</b></div>
		<div class="summary-row"><span>Доставка</span><b>${order.delivery ? money(order.delivery) : 'бесплатно'}</b></div>
		<div class="summary-row summary-row--total"><span>Итого</span><b>${money(order.total)}</b></div>
	</div>
	<div class="card" data-reveal data-delay="140">
		<h2 class="card__title">Доставка</h2>
		<p class="muted">${escapeHtml(order.customer.name || '')}<br />${escapeHtml(order.customer.phone)}<br />${escapeHtml(
		order.customer.address
	)}</p>
		<p class="muted">Оплата: ${order.payment === 'card' ? 'картой курьеру' : 'наличными'}</p>
		${order.customer.comment ? `<p class="muted">Комментарий: ${escapeHtml(order.customer.comment)}</p>` : ''}
		<h3 class="card__subtitle">История статусов</h3>
		<ul class="summary-list">
			${(order.history || [])
				.map((item) => `<li><span>${STATUS_LABELS[item.status] || item.status}</span><b>${formatDate(item.at)}</b></li>`)
				.join('')}
		</ul>
	</div>
</section>`

	return {
		html,
		mount(root) {
			const refresh = root.querySelector('#refreshOrder')
			if (refresh) refresh.addEventListener('click', () => go(`/order/${order.id}`))
		}
	}
}

// ── 404 ───────────────────────────
export async function notFoundView() {
	return {
		html: `<section class="section shell empty-state" data-reveal>
	<h1>Страница не найдена</h1>
	<p>Но у нас есть горячие бао.</p>
	<button type="button" class="btn btn--primary" data-go="/menu">В меню</button>
</section>`
	}
}
