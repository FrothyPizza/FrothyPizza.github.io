/**
 * A ~100 line test runner.
 *
 * No dependencies on purpose: this project installs nothing, and the suite has
 * to be runnable with a bare `node tests/run.js` on any machine that can serve
 * the game.
 */

const suites = [];
let current = null;

export function describe(name, fn) {
	current = { name, tests: [] };
	suites.push(current);
	fn();
	current = null;
}

export function test(name, fn) {
	if (!current) throw new Error('test() must be called inside describe()');
	current.tests.push({ name, fn });
}

export class AssertionError extends Error {}

export function assert(condition, message) {
	if (!condition) throw new AssertionError(message || 'assertion failed');
}

export function assertEqual(actual, expected, message) {
	if (!Object.is(actual, expected)) {
		throw new AssertionError(`${message || 'values differ'}\n  expected: ${show(expected)}\n  actual:   ${show(actual)}`);
	}
}

export function assertClose(actual, expected, epsilon, message) {
	if (!(Math.abs(actual - expected) <= epsilon)) {
		throw new AssertionError(`${message || 'values differ'}\n  expected: ${show(expected)} ±${epsilon}\n  actual:   ${show(actual)}`);
	}
}

export function assertDeepEqual(actual, expected, message) {
	const a = JSON.stringify(expected, null, 1);
	const b = JSON.stringify(actual, null, 1);
	if (a !== b) throw new AssertionError(`${message || 'structures differ'}\n  expected: ${a}\n  actual:   ${b}`);
}

/** Fails with the first few differences from `snapshot.diff()`. */
export function assertNoDifferences(problems, message) {
	if (problems.length === 0) return;
	const shown = problems.slice(0, 12).join('\n    ');
	const more = problems.length > 12 ? `\n    ...and ${problems.length - 12} more` : '';
	throw new AssertionError(`${message}\n    ${shown}${more}`);
}

function show(value) {
	if (typeof value === 'string') return JSON.stringify(value);
	return String(value);
}

export async function runAll() {
	let passed = 0;
	const failures = [];
	const started = Date.now();

	for (const suite of suites) {
		process.stdout.write(`\n${suite.name}\n`);
		for (const item of suite.tests) {
			try {
				await item.fn();
				++passed;
				process.stdout.write(`  ok   ${item.name}\n`);
			} catch (error) {
				failures.push({ suite: suite.name, test: item.name, error });
				process.stdout.write(`  FAIL ${item.name}\n`);
			}
		}
	}

	const elapsed = ((Date.now() - started) / 1000).toFixed(2);
	process.stdout.write(`\n${passed} passed, ${failures.length} failed  (${elapsed}s)\n`);

	if (failures.length > 0) {
		process.stdout.write('\n--- failures ---\n');
		for (const failure of failures) {
			process.stdout.write(`\n${failure.suite} > ${failure.test}\n`);
			const error = failure.error;
			process.stdout.write(`${error instanceof AssertionError ? error.message : error.stack}\n`);
		}
		process.exitCode = 1;
	}
	return failures.length === 0;
}
