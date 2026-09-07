/**
 * Test entry point:  node tests/run.js  (or `npm test`)
 *
 * Pass a substring to run a subset:  node tests/run.js differential
 */
import { runAll } from './framework.js';

const filter = process.argv[2];
const SUITES = [
	'./animation-parity.test.js',
	'./ticker.test.js',
	'./timers.test.js',
	'./levels.test.js',
	'./menu.test.js',
	'./renderer.test.js',
	'./lifecycle.test.js',
	'./bosses.test.js',
	'./differential.test.js',
];

for (const suite of SUITES) {
	if (filter && !suite.includes(filter)) continue;
	await import(suite);
}

await runAll();
