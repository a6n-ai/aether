// The Anatomy figures label themselves for engineers. These rules rewrite their titles, hints and live readouts
// into words a shop owner uses. Every rule must be idempotent: rewritten text is observed and passed through again.
import type { FigureName } from './figure';

type Rule = [RegExp, string | ((...m: string[]) => string)];

const seconds: Rule = [/(\d+) ms\b/g, (_, ms) => `${(Number(ms) / 1000).toFixed(1)} s`];

const DEMO = 'hello, claude';
const OURS = 'hello, a6n.ai'; // same length as DEMO, so a rewritten line maps to itself

const RULES: Record<FigureName, Rule[]> = {
	computer: [
		[/^Desk computer$/, 'Your idea, on screen'],
		[/^Type on it · click it to switch$/, 'Type on it · click to switch off'],
		[/ chars\b/, ' letters'],
		[/ · key .*$/, ''],
		// The idle tour types a greeting to Claude; type ours instead, letter for letter.
		[/^> (.*)$/, (line, body) => (body && DEMO.startsWith(body) ? `> ${OURS.slice(0, body.length)}` : line)],
	],
	'hash-map': [
		[/^Tap to file · hover a bucket$/, 'Tap to file · hover a pigeonhole'],
		[/^get (\w+)/, 'find $1'],
		[/^put (\w+)/, 'file $1'],
		[/0x[0-9A-F]+ mod \d+ = (\d+)/, 'pigeonhole $1'],
		[/check \d+: (\w+) ≠ (\w+)/, '$1 is not $2'],
		[/\bbuckets?\b/g, 'pigeonhole'],
		[/^mod 8$/, '8 holes'],
	],
	watch: [
		[/^Drag crown ↑ to wind · S slow · E anatomy$/, 'Drag the crown · S slow · E take apart'],
		[/\d+ Hz · [\d,]+ vph/, 'ticking'],
		[/reserve ([\d.]+) h/, '$1 h of power left'],
		[/ · amplitude \d+°/, ''],
	],
	'message-queue': [
		[/^Message queue$/, 'Messages in line'],
		[/^Drag to set rate · tap a drum$/, 'Drag to send faster · tap a drum'],
		[/(\d+) queued/, '$1 waiting'],
		[/\bin ([\d.]+)\/s/, '$1 arriving a second'],
		[/\bout ([\d.]+)\/s/, '$1 sent a second'],
		[/^msg\/s$/, 'per second'],
	],
	'git-merge': [
		[/^Branch and merge$/, 'Built beside your line'],
		[/^Drag to commit · tap to merge$/, 'Drag to add a station · tap to join the lines'],
		[/^main (\d+) ahead · (\d+) behind$/, 'main line +$1 · side line +$2 stations'],
		[/fast-forward → \w+/, 'joined straight on'],
		[/merge → \w+/, 'lines joined'],
		[/^commit → \w+/, 'new station laid'],
	],
	dns: [
		[/^Name resolver$/, 'Route finder'],
		[/^Tap to look up · ← →$/, 'Tap to find a route · ← →'],
		[/ → [\d.]+ · /, ' found in '],
		[/www\.example\.com/g, 'shop order'],
		[/mail\.example\.com/g, 'kitchen order'],
		[/asking example\.com/g, 'asking the depot'],
		[/asking com\b/g, 'asking the city hub'],
		[/asking (the )?root\b/g, 'asking the main hub'],
		[/^53$/, ''],
		seconds,
	],
	'tcp-handshake': [
		[/^Three-way handshake$/, 'Three-step hello'],
		[/^Tap to connect · hut to drop$/, 'Tap to send · tap the hut to lose one'],
		[/SYN-SENT/g, 'hello sent'],
		[/SYN-RECEIVED|SYN-RCVD/g, 'hello received'],
		[/ESTABLISHED/g, 'connected'],
		[/LISTEN\b/g, 'listening'],
		[/CLOSED/g, 'closed'],
		[/\bSYN\b/g, 'hello'],
		[/\bACK\b/g, 'reply'],
		[/drop armed/, 'next one will be lost'],
		[/resend in/, 'trying again in'],
		[/segment/g, 'message'],
		[/^:443$/, ''],
		seconds,
	],
	'rate-limiter': [
		[/^Token bucket$/, 'Seats left'],
		[/^Hold to punch · hover the tape$/, 'Hold to book · hover the tape'],
		[/^([\d.]+) \/ (\d+)/, (_, left, of) => `${Math.floor(Number(left))} of ${of} seats left`],
		[/(\d+) passed/, '$1 booked'],
		[/(\d+) refused/, '$1 turned away'],
	],
	'public-key': [
		[/^Two-key box$/, "Members' strongbox"],
		[/private key/g, "member's own key"],
		[/public key/g, 'shop key'],
		[/^(sealed|opened|locked) · \d+ → \d+$/, '$1'],
		[/^n \d+ · e \d+$/, ''],
	],
};

export function plainWords(figure: FigureName, text: string) {
	return (RULES[figure] ?? []).reduce((t, [re, to]) => t.replace(re, to as string), text);
}
