// Векторная арт-система КИМ БАО.
// Все изображения блюд — SVG, генерируются локально и не требуют интернета.

const uid = (() => {
	let i = 0
	return () => `a${(i += 1)}`
})()

function shell(inner, { pal, seed = 0 }) {
	const g = uid()
	const glow = uid()
	return `<svg class="dish-art" viewBox="0 0 320 260" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
	<defs>
		<radialGradient id="${g}" cx="50%" cy="38%" r="70%">
			<stop offset="0%" stop-color="${pal[0]}" stop-opacity=".95"/>
			<stop offset="58%" stop-color="${pal[1]}" stop-opacity=".55"/>
			<stop offset="100%" stop-color="${pal[2]}" stop-opacity=".08"/>
		</radialGradient>
		<filter id="${glow}" x="-30%" y="-30%" width="160%" height="160%">
			<feGaussianBlur stdDeviation="9"/>
		</filter>
	</defs>
	<circle cx="160" cy="118" r="96" fill="url(#${g})" filter="url(#${glow})" opacity=".85"/>
	<g class="dish-art__plate">
		<ellipse cx="160" cy="206" rx="96" ry="18" fill="#000" opacity=".28"/>
	</g>
	<g class="dish-art__body" transform="rotate(${(seed % 5) - 2} 160 130)">${inner}</g>
</svg>`
}

function sesame(x, y, color = '#FFF6DF') {
	return `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="2.2" fill="${color}" opacity=".9"/>`
}

const BUILDERS = {
	bao: (p) => `
		<path d="M70 150c0-46 40-78 90-78s90 32 90 78c0 10-8 16-20 16H90c-12 0-20-6-20-16Z" fill="#FDF3E3"/>
		<path d="M70 150c0-46 40-78 90-78s90 32 90 78" fill="none" stroke="#E9D8BF" stroke-width="3"/>
		<path d="M84 160c22-14 52-20 76-20s54 6 76 20c-6 22-40 34-76 34s-70-12-76-34Z" fill="${p[1]}"/>
		<path d="M96 158c18-9 40-13 64-13s46 4 64 13" fill="none" stroke="${p[2]}" stroke-width="6" stroke-linecap="round" opacity=".85"/>
		<path d="M104 172c14 6 34 10 56 10s42-4 56-10" fill="none" stroke="${p[0]}" stroke-width="5" stroke-linecap="round"/>
		<path d="M112 150c10-8 26-12 48-12s38 4 48 12" fill="none" stroke="#8FBF6A" stroke-width="5" stroke-linecap="round"/>
		<path d="M74 178c22 22 52 32 86 32s64-10 86-32c2 14-4 24-16 30H90c-12-6-18-16-16-30Z" fill="#F7E9D2"/>
		${sesame(130, 128)}${sesame(178, 122)}${sesame(206, 138)}${sesame(108, 140)}`,
	bowl: (p) => `
		<path d="M62 128h196c0 52-44 84-98 84S62 180 62 128Z" fill="#1B1512"/>
		<path d="M62 128h196c0 10-2 19-5 28H67c-3-9-5-18-5-28Z" fill="#2A211C"/>
		<ellipse cx="160" cy="128" rx="98" ry="22" fill="${p[1]}"/>
		<ellipse cx="160" cy="126" rx="86" ry="18" fill="${p[0]}"/>
		<g opacity=".95">
			<circle cx="122" cy="122" r="14" fill="${p[2]}"/>
			<circle cx="158" cy="132" r="16" fill="#FFF1D6"/>
			<circle cx="196" cy="120" r="13" fill="${p[2]}"/>
			<circle cx="176" cy="114" r="9" fill="#8FBF6A"/>
			<circle cx="138" cy="136" r="8" fill="#8FBF6A"/>
		</g>
		<path d="M128 96c8-14 2-22-4-30 16 6 24 18 18 30Zm34-6c8-16 2-26-6-34 18 6 28 20 20 34Zm34 8c7-12 2-20-4-26 15 5 22 15 16 26Z" fill="#FFFFFF" opacity=".22"/>
		${sesame(146, 118)}${sesame(184, 132)}`,
	noodles: (p) => `
		<path d="M60 126h200c0 54-46 88-100 88S60 180 60 126Z" fill="#171310"/>
		<ellipse cx="160" cy="126" rx="100" ry="23" fill="${p[1]}"/>
		<ellipse cx="160" cy="126" rx="88" ry="19" fill="${p[0]}" opacity=".9"/>
		<g fill="none" stroke="#F7DFA5" stroke-width="5" stroke-linecap="round" opacity=".95">
			<path d="M100 126c14-16 34-18 52-8s38 8 52-8"/>
			<path d="M96 136c18-12 36-10 54 0s40 6 56-10"/>
			<path d="M110 116c16-10 30-6 46 4s34 2 46-10"/>
		</g>
		<circle cx="196" cy="124" r="17" fill="#FFF3DA"/>
		<circle cx="196" cy="124" r="8" fill="${p[1]}"/>
		<rect x="104" y="110" width="34" height="22" rx="6" fill="${p[2]}" opacity=".9"/>
		<path d="M150 88c9-15 3-25-5-33 18 7 28 21 20 33Zm36 4c7-12 2-20-4-26 15 5 22 15 16 26Z" fill="#FFFFFF" opacity=".2"/>
		${sesame(134, 120)}${sesame(170, 132)}`,
	skewer: (p) => `
		<rect x="152" y="150" width="12" height="78" rx="6" fill="#C39A63"/>
		<path d="M158 40c34 0 56 26 56 62s-22 56-56 56-56-20-56-56 22-62 56-62Z" fill="${p[0]}"/>
		<path d="M158 52c26 0 44 20 44 50s-18 44-44 44-44-14-44-44 18-50 44-50Z" fill="${p[1]}" opacity=".55"/>
		<g fill="${p[2]}" opacity=".9">
			<circle cx="136" cy="84" r="6"/><circle cx="178" cy="72" r="5"/><circle cx="166" cy="112" r="6"/>
			<circle cx="126" cy="120" r="5"/><circle cx="190" cy="106" r="5"/>
		</g>
		<path d="M108 92c22-18 78-20 102 2" fill="none" stroke="#FFF4DA" stroke-width="5" stroke-linecap="round" opacity=".8"/>
		<path d="M112 118c26 16 68 14 96-4" fill="none" stroke="#E14B2A" stroke-width="5" stroke-linecap="round" opacity=".85"/>`,
	wings: (p) => `
		<ellipse cx="160" cy="166" rx="104" ry="34" fill="#1B1512"/>
		<ellipse cx="160" cy="160" rx="96" ry="28" fill="#241B16"/>
		<g>
			<path d="M96 148c-14-16-8-38 12-44 18-6 34 6 38 22 3 14-6 26-20 28-12 2-22-2-30-6Z" fill="${p[0]}"/>
			<path d="M148 132c-8-20 6-38 26-38s34 16 30 34c-4 16-20 24-34 20-10-2-18-8-22-16Z" fill="${p[1]}"/>
			<path d="M206 150c-10-14-4-32 14-36 16-4 30 6 32 22 2 14-8 24-22 24-10 0-18-4-24-10Z" fill="${p[0]}"/>
		</g>
		<g stroke="${p[2]}" stroke-width="4" stroke-linecap="round" fill="none" opacity=".8">
			<path d="M104 128c10 8 22 10 32 4"/><path d="M160 110c10 8 22 10 32 4"/><path d="M214 136c10 8 20 8 28 2"/>
		</g>
		${sesame(126, 152)}${sesame(178, 146)}${sesame(214, 158)}${sesame(150, 162)}`,
	cup: (p) => `
		<path d="M112 70h96l-12 140c-1 12-10 20-22 20h-28c-12 0-21-8-22-20L112 70Z" fill="#F4EFE6" opacity=".18"/>
		<path d="M118 108h84l-9 100c-1 10-8 16-18 16h-30c-10 0-17-6-18-16l-9-100Z" fill="${p[0]}"/>
		<path d="M122 140h76l-7 68c-1 10-8 16-18 16h-26c-10 0-17-6-18-16l-7-68Z" fill="${p[1]}" opacity=".75"/>
		<rect x="104" y="62" width="112" height="16" rx="8" fill="#FFFFFF" opacity=".35"/>
		<rect x="178" y="24" width="11" height="90" rx="5" fill="${p[2]}" transform="rotate(9 183 69)"/>
		<g fill="#FFFFFF" opacity=".55">
			<circle cx="142" cy="126" r="7"/><circle cx="170" cy="114" r="5"/><circle cx="186" cy="134" r="6"/>
		</g>
		<g fill="#3A2418" opacity=".85">
			<circle cx="140" cy="206" r="8"/><circle cx="160" cy="214" r="8"/><circle cx="180" cy="204" r="8"/>
		</g>`,
	hotteok: (p) => `
		<ellipse cx="160" cy="188" rx="96" ry="26" fill="#1B1512"/>
		<circle cx="128" cy="140" r="58" fill="${p[0]}"/>
		<circle cx="128" cy="140" r="44" fill="${p[1]}" opacity=".45"/>
		<circle cx="200" cy="152" r="48" fill="${p[0]}" opacity=".95"/>
		<circle cx="200" cy="152" r="34" fill="${p[2]}" opacity=".35"/>
		<path d="M104 136c14-10 34-10 48 2" fill="none" stroke="${p[2]}" stroke-width="5" stroke-linecap="round"/>
		<path d="M182 148c12-8 26-8 36 2" fill="none" stroke="${p[2]}" stroke-width="5" stroke-linecap="round"/>
		${sesame(140, 118)}${sesame(112, 158)}${sesame(210, 132)}`
}

export function dishArt(dish) {
	const art = dish.art || { type: 'bowl', palette: ['#FF7A45', '#D02F16', '#FFD9A0'] }
	const build = BUILDERS[art.type] || BUILDERS.bowl
	const seed = dish.id ? dish.id.length : 0
	return shell(build(art.palette), { pal: art.palette, seed })
}

export function heroArt() {
	return `<svg viewBox="0 0 520 520" class="hero-art__svg" aria-hidden="true">
	<defs>
		<radialGradient id="heroGlow" cx="50%" cy="45%" r="60%">
			<stop offset="0%" stop-color="#FF6A3D" stop-opacity=".85"/>
			<stop offset="60%" stop-color="#C21F0F" stop-opacity=".35"/>
			<stop offset="100%" stop-color="#0E0C0B" stop-opacity="0"/>
		</radialGradient>
	</defs>
	<circle cx="260" cy="250" r="215" fill="url(#heroGlow)"/>
	<circle cx="260" cy="250" r="168" fill="none" stroke="rgba(255,238,214,.25)" stroke-width="1.5" stroke-dasharray="5 12"/>
	<circle cx="260" cy="250" r="210" fill="none" stroke="rgba(255,238,214,.14)" stroke-width="1"/>
</svg>`
}

export const FLOATING_GLYPHS = ['김', '밥', '불', '맛', '서울', '항']
