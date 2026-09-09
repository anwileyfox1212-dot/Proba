// Меню ресторана КИМ БАО. Статические данные (часть «схемы БД»: блюда не изменяются из админки).
// art — тип векторной иллюстрации блюда и палитра (см. public/js/art.js)

export const CATEGORIES = [
	{ id: 'bao', title: 'Бао и бургеры', caption: 'Паровые булочки ручной лепки' },
	{ id: 'street', title: 'Уличная классика', caption: 'То, что жарят на рынках Сеула' },
	{ id: 'noodles', title: 'Лапша и рис', caption: 'Горячие вок-блюда и боулы' },
	{ id: 'drinks', title: 'Напитки и десерты', caption: 'Прохлада после огня' }
]

export const MENU = [
	{
		id: 'bao-pork',
		name: 'Бао с томлёной свининой',
		category: 'bao',
		price: 420,
		weight: '180 г',
		spicy: 1,
		tags: ['хит'],
		description: 'Воздушная паровая булочка с 12-часовой свиной грудинкой в глазури кочхуджан.',
		composition: ['паровая булочка бао', 'свиная грудинка', 'соус кочхуджан', 'маринованный огурец', 'зелёный лук', 'кунжут'],
		art: { type: 'bao', palette: ['#F6C453', '#E0662F', '#8C1F16'] }
	},
	{
		id: 'bao-chicken',
		name: 'Бао с хрустящей курицей',
		category: 'bao',
		price: 390,
		weight: '175 г',
		spicy: 2,
		tags: ['острое'],
		description: 'Куриное бедро в двойной панировке, соус янним и хрустящая капуста.',
		composition: ['паровая булочка бао', 'куриное бедро', 'соус янним', 'капуста', 'кимчи-майо', 'кинза'],
		art: { type: 'bao', palette: ['#FFE0A3', '#E4522B', '#7A1710'] }
	},
	{
		id: 'bao-tofu',
		name: 'Бао с тофу и грибами',
		category: 'bao',
		price: 350,
		weight: '170 г',
		spicy: 0,
		tags: ['веган'],
		description: 'Обжаренный тофу, шиитаке в соевой карамели и хрустящий лук.',
		composition: ['паровая булочка бао', 'тофу', 'грибы шиитаке', 'соевая карамель', 'жареный лук', 'микрозелень'],
		art: { type: 'bao', palette: ['#EAF3D2', '#6FA24B', '#2F5A2A'] }
	},
	{
		id: 'street-tteok',
		name: 'Токпокки в соусе КИМ БАО',
		category: 'street',
		price: 460,
		weight: '320 г',
		spicy: 3,
		tags: ['хит', 'острое'],
		description: 'Рисовые клёцки в густом остро-сладком соусе с сыром моцарелла.',
		composition: ['рисовые клёцки тток', 'соус кочхуджан', 'моцарелла', 'рыбный кекс обан', 'зелёный лук'],
		art: { type: 'bowl', palette: ['#FF7A45', '#D02F16', '#FFD9A0'] }
	},
	{
		id: 'street-corndog',
		name: 'Корн-дог с моцареллой',
		category: 'street',
		price: 320,
		weight: '150 г',
		spicy: 0,
		tags: ['хит'],
		description: 'Тянущийся сыр и сосиска в хрустящем кляре с сахарной корочкой.',
		composition: ['сосиска', 'моцарелла', 'кляр', 'панко', 'сахар', 'соус на выбор'],
		art: { type: 'skewer', palette: ['#F8B24A', '#C96A18', '#FFF0C9'] }
	},
	{
		id: 'street-wings',
		name: 'Крылья янним',
		category: 'street',
		price: 540,
		weight: '300 г',
		spicy: 2,
		tags: ['острое'],
		description: 'Двойная обжарка, липкая глазурь с чесноком и арахисом.',
		composition: ['куриные крылья', 'соус янним', 'чеснок', 'арахис', 'кунжут'],
		art: { type: 'wings', palette: ['#FF9A3D', '#B32B12', '#FFE2B0'] }
	},
	{
		id: 'noodles-japchae',
		name: 'Чапче с говядиной',
		category: 'noodles',
		price: 590,
		weight: '340 г',
		spicy: 0,
		tags: [],
		description: 'Стеклянная лапша из батата с говядиной и овощами на воке.',
		composition: ['лапша из батата', 'говядина', 'морковь', 'шпинат', 'кунжутное масло', 'соевый соус'],
		art: { type: 'noodles', palette: ['#E9C46A', '#8A5A2B', '#4B3216'] }
	},
	{
		id: 'noodles-ramyeon',
		name: 'Рамён «Огонь Сеула»',
		category: 'noodles',
		price: 620,
		weight: '450 г',
		spicy: 3,
		tags: ['острое'],
		description: 'Наваристый бульон 8 часов, чили-масло, яйцо аджитама и чашу.',
		composition: ['пшеничная лапша', 'свиной бульон', 'чили-масло', 'яйцо аджитама', 'чашу', 'нори'],
		art: { type: 'noodles', palette: ['#FF8A5B', '#C0341A', '#FFD6A5'] }
	},
	{
		id: 'noodles-bibimbap',
		name: 'Бибимбап с овощами',
		category: 'noodles',
		price: 480,
		weight: '380 г',
		spicy: 1,
		tags: ['веган'],
		description: 'Рис в горячей чаше, сезонные овощи и паста кочхуджан.',
		composition: ['рис', 'морковь', 'шпинат', 'ростки сои', 'грибы', 'кочхуджан'],
		art: { type: 'bowl', palette: ['#7FB069', '#E0A458', '#B23A2A'] }
	},
	{
		id: 'drink-yuja',
		name: 'Юдза-лимонад',
		category: 'drinks',
		price: 260,
		weight: '400 мл',
		spicy: 0,
		tags: ['хит'],
		description: 'Корейский цитрус юдза, лёд и веточка розмарина.',
		composition: ['юдза-конфитюр', 'газированная вода', 'лайм', 'розмарин', 'лёд'],
		art: { type: 'cup', palette: ['#FFD166', '#F2913D', '#FFF3D0'] }
	},
	{
		id: 'drink-milk-tea',
		name: 'Чёрный чай-латте с тапиокой',
		category: 'drinks',
		price: 290,
		weight: '450 мл',
		spicy: 0,
		tags: [],
		description: 'Плотный ассам, молоко и жемчужины тапиоки на тростниковом сахаре.',
		composition: ['чай ассам', 'молоко', 'тапиока', 'тростниковый сахар'],
		art: { type: 'cup', palette: ['#D9B18C', '#8B5E3C', '#3A2418'] }
	},
	{
		id: 'dessert-hotteok',
		name: 'Хоттоки с орехами',
		category: 'drinks',
		price: 240,
		weight: '2 шт',
		spicy: 0,
		tags: [],
		description: 'Горячие оладьи с корицей, коричневым сахаром и грецким орехом.',
		composition: ['дрожжевое тесто', 'коричневый сахар', 'корица', 'грецкий орех'],
		art: { type: 'hotteok', palette: ['#F3C178', '#B4651C', '#6B3410'] }
	}
]

export function findDish(id) {
	return MENU.find((dish) => dish.id === id) || null
}
