// Единая Motion Design-система КИМ БАО.
// Всё строится на трёх примитивах: reveal (появление), depth (параллакс/3D), transition (переходы).
// Все скролл-эффекты идут через один rAF-цикл, появления — через IntersectionObserver.

export const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const isCoarse = window.matchMedia('(pointer: coarse)').matches
const isSmall = () => window.innerWidth < 760

// ── 1. Reveal + stagger ─────────────────────────────
let revealObserver = null

function ensureObserver() {
	if (revealObserver || prefersReduced) return revealObserver
	revealObserver = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue
				const el = entry.target
				const delay = Number(el.dataset.delay || 0)
				el.style.transitionDelay = `${delay}ms`
				el.dataset.shown = 'true'
				revealObserver.unobserve(el)
			}
		},
		{ rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
	)
	return revealObserver
}

export function bindReveals(root = document) {
	const nodes = root.querySelectorAll('[data-reveal]:not([data-shown])')
	if (prefersReduced) {
		nodes.forEach((n) => (n.dataset.shown = 'true'))
		return
	}
	const observer = ensureObserver()
	// stagger внутри одной группы
	root.querySelectorAll('[data-stagger]').forEach((group) => {
		const step = Number(group.dataset.stagger) || 70
		Array.from(group.children).forEach((child, index) => {
			if (child.hasAttribute('data-reveal') && !child.dataset.delay) {
				child.dataset.delay = String(Math.min(index * step, 520))
			}
		})
	})
	nodes.forEach((n) => observer.observe(n))
}

// ── 2. Depth: parallax + scroll-driven ─────────────────────
const parallaxNodes = new Set()
let ticking = false
let pointerX = 0
let pointerY = 0

export function bindParallax(root = document) {
	parallaxNodes.clear()
	root.querySelectorAll('[data-parallax]').forEach((el) => parallaxNodes.add(el))
	updateFrame()
}

function updateFrame() {
	const scrollY = window.scrollY
	const vh = window.innerHeight
	const mobile = isSmall()
	parallaxNodes.forEach((el) => {
		const speed = Number(el.dataset.parallax) || 0.1
		const rect = el.getBoundingClientRect()
		const center = rect.top + rect.height / 2 - vh / 2
		const damp = mobile ? 0.45 : 1
		const shift = -center * speed * damp
		const tilt = el.dataset.parallaxTilt ? ` rotate(${(shift / 60).toFixed(2)}deg)` : ''
		const px = el.dataset.parallaxPointer && !isCoarse ? pointerX * (speed * 90) : 0
		const py = el.dataset.parallaxPointer && !isCoarse ? pointerY * (speed * 70) : 0
		el.style.transform = `translate3d(${px.toFixed(1)}px, ${(shift + py).toFixed(1)}px, 0)${tilt}`
	})
	// scroll progress для header
	const header = document.getElementById('siteHeader')
	if (header) header.dataset.scrolled = scrollY > 30 ? 'true' : 'false'
	ticking = false
}

function onScroll() {
	if (prefersReduced) return
	if (!ticking) {
		ticking = true
		requestAnimationFrame(updateFrame)
	}
}

window.addEventListener('scroll', onScroll, { passive: true })
window.addEventListener('resize', onScroll, { passive: true })

if (!isCoarse && !prefersReduced) {
	window.addEventListener(
		'pointermove',
		(event) => {
			pointerX = (event.clientX / window.innerWidth - 0.5) * 2
			pointerY = (event.clientY / window.innerHeight - 0.5) * 2
			onScroll()
		},
		{ passive: true }
	)
}

// ── 3. 3D tilt для карточек ───────────────────────
export function bindTilt(root = document) {
	if (isCoarse || prefersReduced) return
	root.querySelectorAll('[data-tilt]').forEach((card) => {
		if (card.dataset.tiltBound) return
		card.dataset.tiltBound = '1'
		let raf = 0
		const move = (event) => {
			if (raf) return
			raf = requestAnimationFrame(() => {
				raf = 0
				const rect = card.getBoundingClientRect()
				const x = (event.clientX - rect.left) / rect.width - 0.5
				const y = (event.clientY - rect.top) / rect.height - 0.5
				card.style.transform = `perspective(900px) rotateY(${(x * 9).toFixed(2)}deg) rotateX(${(-y * 9).toFixed(
					2
				)}deg) translateY(-6px)`
			})
		}
		const reset = () => {
			card.style.transform = ''
		}
		card.addEventListener('pointermove', move)
		card.addEventListener('pointerleave', reset)
	})
}

// ── 4. Кинетическая типографика ──────────────────
export function kinetic(text, baseDelay = 0) {
	return Array.from(text)
		.map((char, index) => {
			const safe = char === ' ' ? '&nbsp;' : char
			return `<span style="animation-delay:${(baseDelay + index * 0.035).toFixed(3)}s">${safe}</span>`
		})
		.join('')
}

// ── 5. Переходы между страницами ─────────────────
export function curtain(phase) {
	const node = document.getElementById('pageCurtain')
	if (!node || prefersReduced) return Promise.resolve()
	node.dataset.state = phase
	return new Promise((resolve) => {
		const done = () => {
			node.removeEventListener('animationend', done)
			resolve()
		}
		node.addEventListener('animationend', done)
		setTimeout(resolve, 620)
	})
}

// ── 6. Полёт блюда в корзину ────────────────────
export function flyToCart(sourceEl) {
	const cartBtn = document.getElementById('cartBtn')
	const layer = document.getElementById('flyLayer')
	if (!sourceEl || !cartBtn || !layer) return
	cartBtn.dataset.bump = 'true'
	setTimeout(() => (cartBtn.dataset.bump = 'false'), 560)
	if (prefersReduced) return

	const from = sourceEl.getBoundingClientRect()
	const to = cartBtn.getBoundingClientRect()
	const ghost = document.createElement('div')
	ghost.className = 'fly-item'
	ghost.innerHTML = sourceEl.innerHTML
	ghost.style.left = `${from.left + from.width / 2 - 46}px`
	ghost.style.top = `${from.top + from.height / 2 - 46}px`
	layer.appendChild(ghost)

	const dx = to.left + to.width / 2 - (from.left + from.width / 2)
	const dy = to.top + to.height / 2 - (from.top + from.height / 2)
	const animation = ghost.animate(
		[
			{ transform: 'translate3d(0,0,0) scale(1) rotate(0deg)', opacity: 1 },
			{ transform: `translate3d(${dx * 0.45}px, ${dy * 0.35 - 90}px, 0) scale(0.8) rotate(-16deg)`, opacity: 1, offset: 0.55 },
			{ transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.18) rotate(22deg)`, opacity: 0.2 }
		],
		{ duration: 900, easing: 'cubic-bezier(.5,-0.1,.2,1)' }
	)
	animation.onfinish = () => ghost.remove()
}

// ── 7. Тосты ────────────────────────────────
export function toast(message, type = 'info') {
	const layer = document.getElementById('toastLayer')
	if (!layer) return
	const node = document.createElement('div')
	node.className = 'toast'
	node.dataset.type = type
	node.textContent = message
	layer.appendChild(node)
	setTimeout(() => {
		node.dataset.hide = 'true'
		setTimeout(() => node.remove(), 400)
	}, 3200)
}

// ── 8. Preloader ───────────────────────────────
export function runPreloader() {
	const node = document.getElementById('preloader')
	const bar = document.getElementById('preloaderBar')
	const count = document.getElementById('preloaderCount')
	if (!node) return Promise.resolve()
	const total = prefersReduced ? 260 : 1500
	const start = performance.now()
	return new Promise((resolve) => {
		const tick = (now) => {
			const progress = Math.min(1, (now - start) / total)
			const eased = Math.round(progress * 100)
			if (bar) bar.style.width = `${eased}%`
			if (count) count.textContent = `${eased}%`
			if (progress < 1) {
				requestAnimationFrame(tick)
				return
			}
			node.dataset.done = 'true'
			document.body.dataset.loading = 'false'
			setTimeout(() => {
				node.remove()
				resolve()
			}, 650)
		}
		requestAnimationFrame(tick)
	})
}

// ── 9. Пересборка всех эффектов после рендера страницы ──────────
export function refreshMotion(root = document) {
	bindReveals(root)
	bindParallax(document)
	bindTilt(root)
}
