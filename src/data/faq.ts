// Questions owners ask, with plain answers. The home page shows the first nine; /how-it-works has them all.
export type Qa = { q: string; a: string };
export const FAQ: Qa[] = [
	{
		q: 'What is a6n?',
		a: "a6n, short for (Ai)ny Management System, is one system that runs a business's orders, bookings, payments, customers and messages. A business can start on a6n to go online, or keep its current system and connect a6n to add AI. Our team sets it up and runs it with you.",
	},
	{
		q: 'Do I need to know anything about tech?',
		a: 'No. You tell us how your business works today, in your own words. We handle everything technical and explain choices in plain language.',
	},
	{
		q: 'Can a6n work with the system I already use?',
		a: "Yes. a6n connects to the tools you already run, like your till or your booking system, so you keep what works and add what's missing. If you'd rather move over fully, we bring your records across.",
	},
	{
		q: 'What can AI do for my business?',
		a: 'An AI assistant answers any question a customer asks about your business, day or night, from your own menu, prices, bookings and policies. It also makes your business readable by assistants like ChatGPT, so they can recommend you. A person approves anything that changes a record.',
	},
	{
		q: 'How long does it take?',
		a: "It depends on what you need. Because we start from parts already running for other businesses, a first version comes together much faster than building from zero. We'll give you a clear plan after the first call.",
	},
	{
		q: 'How much does it cost?',
		a: 'Every business is different, so we quote after a short call, once we understand what you need.',
	},
	{
		q: 'I already use spreadsheets or another system. Can you move it over?',
		a: 'Yes. We bring your customers and records across, so you start in the new app without losing anything.',
	},
	{
		q: 'Who owns what you build?',
		a: 'Your data is yours: your customers, orders and records, and you can export them any time. Anything we build only for your business is yours too. The a6n system underneath stays ours and keeps improving, so you get every fix and new feature without paying to rebuild.',
	},
	{
		q: 'What happens if something breaks?',
		a: 'We keep watch every day and fix it. We work like your own tech team, so you talk to the same people who built it.',
	},
	{
		q: 'Can my customers pay online?',
		a: 'Yes. Our clients take card payments, bank transfers, UPI and cash, depending on the country and what suits the business.',
	},
	{
		q: 'Can I send messages to my customers?',
		a: 'Yes. Order emails, reminders and offers go out automatically, with in-app notices too. If a message fails, it is sent again.',
	},
];
