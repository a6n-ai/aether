// Live features only, from the a6n product catalog (status read 12 Oct 2026).
export interface Client {
	slug: 'tiffingrab' | 'puchkaman' | 'xplorers' | 'copper-cloves';
	name: string;
	pigment: string;
	kind: string;
	where: string;
	line: string;
	intro: string;
	features: { title: string; items: string[] }[];
}

export const CLIENTS: Client[] = [
	{
		slug: 'tiffingrab',
		name: 'TiffinGrab',
		pigment: 'var(--ochre)',
		kind: 'Meal plans, delivered',
		where: 'Greater Toronto Area',
		line: 'Customers build their own plan, pick meals each week and pause when away. The kitchen gets its packing sheet, the drivers get their routes.',
		intro: 'A tiffin and meal-plan kitchen that delivers home-cooked food on a weekly or monthly plan.',
		features: [
			{
				title: 'For customers',
				items: [
					'Build a plan step by step: diet, meal size, delivery days and length',
					'See the price and the savings before paying',
					'Pick meals for each day from the weekly menu',
					'Hold a day or pause for a trip, and deliveries resume on their own',
					'Check by postal code whether the kitchen delivers to you',
				],
			},
			{
				title: 'For the kitchen and drivers',
				items: [
					'A daily packing sheet of what to cook and pack',
					'Container labels printed in the order the driver delivers',
					'Routes sent to the drivers, with deliveries marked done automatically',
				],
			},
			{
				title: 'For the owner',
				items: [
					'Every enquiry becomes a lead, followed through to an order',
					'Coupons and loyalty coins',
					'Reports on sales, customers, deliveries and the most-picked dishes',
				],
			},
		],
	},
	{
		slug: 'puchkaman',
		name: 'Puchkaman',
		pigment: 'var(--verdigris)',
		kind: 'Restaurant ordering',
		where: 'Scarborough, Ontario',
		line: 'Their own ordering website that reads the menu from the restaurant till and sends paid orders straight back to it.',
		intro: 'A restaurant that wanted its own ordering website instead of paying delivery-app commission on every order.',
		features: [
			{
				title: 'For customers',
				items: [
					'The same menu as the till, shown as in stock or sold out',
					'Pickup, or delivery with an address check',
					'Card payment in a secure form',
					'Follow the order from a link, no account needed',
				],
			},
			{
				title: 'For the restaurant',
				items: [
					'Menu, prices, stock and taxes come straight from the till',
					'Paid web orders land on the till, so the kitchen works from one screen',
					'Catering and event enquiries go to staff',
					'Email campaigns and loyalty coins to bring customers back',
				],
			},
		],
	},
	{
		slug: 'xplorers',
		name: 'Xplorers',
		pigment: 'var(--lapis)',
		kind: 'Kids science classes',
		where: 'Singapore',
		line: "Families see what's on, book seats and pay. Staff run classes, payments and promotions from one screen.",
		intro: 'A science club for kids, running classes, camps and birthday sessions.',
		features: [
			{
				title: 'For families',
				items: [
					"A calendar of what's on, with seats left",
					'Book seats, add a code or spend loyalty coins',
					'Pay by cash or transfer and send the reference',
					'Message the club with photos, inside the app',
				],
			},
			{
				title: 'For staff',
				items: [
					'Set up classes and put sessions on the calendar',
					'A roster for each session, with payments to check',
					'Discounts and coupon codes with limits and dates',
					'One profile per family with bookings and payments',
				],
			},
		],
	},
	{
		slug: 'copper-cloves',
		name: 'Copper + Cloves',
		pigment: 'var(--sanguine)',
		kind: 'Boutique studio',
		where: 'Bangalore',
		line: 'Passes, class booking, check-in at the door, a cafe and a shop, all in one member app.',
		intro: 'A fitness and wellness studio with a plant-based cafe and a shop.',
		features: [
			{
				title: 'For members',
				items: [
					'Buy a pass online and book classes with its credits',
					'Scan a QR code at the door to check in',
					'Cancel before the cutoff and see the refund first',
					'Order from the cafe with a member discount',
					'Streaks and badges for showing up',
				],
			},
			{
				title: 'For the studio',
				items: [
					'Instructor dashboards with today’s classes and rosters',
					'Instructor payouts worked out per period',
					'Online, card machine, UPI and cash payments in one ledger',
					'Tax invoices as PDF',
					'Daily dashboard of classes, expiring members and peak hours',
				],
			},
		],
	},
];
