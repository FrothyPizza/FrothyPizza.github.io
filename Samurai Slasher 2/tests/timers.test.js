import { describe, test, assert, assertEqual } from './framework.js';
import { Stopwatch, TimeSource } from '../src/core/clock.js';
import { TimerService } from '../src/core/timers.js';

function fakeClock(start = 0) {
	const state = { now: start };
	const time = new TimeSource(() => state.now);
	return { state, time };
}

/**
 * Gameplay timing is wall-clock, exactly as the original's `setTimeout` and
 * `performance.now()` were. These tests pin the ordering guarantees the systems
 * rely on, and the ownership that stops a dead run's callbacks reaching a live
 * one.
 */
describe('timers: wall-clock semantics', () => {
	test('callbacks fire in deadline order, ties in scheduling order', () => {
		const { state, time } = fakeClock();
		const timers = new TimerService(time);
		const fired = [];

		timers.after(50, () => fired.push('b'));
		timers.after(10, () => fired.push('a'));
		timers.after(50, () => fired.push('c'));

		state.now = 100;
		timers.update();
		assertEqual(fired.join(''), 'abc', 'deadline order, then scheduling order');
	});

	test('a callback scheduled by a callback waits for the next drain', () => {
		const { state, time } = fakeClock();
		const timers = new TimerService(time);
		const fired = [];

		timers.after(10, () => {
			fired.push('outer');
			timers.after(0, () => fired.push('inner'));
		});

		state.now = 20;
		timers.update();
		assertEqual(fired.join(' '), 'outer', 'the browser task queue does not re-enter within one drain');
		timers.update();
		assertEqual(fired.join(' '), 'outer inner', 'and it runs on the next one');
	});

	test('a zero-delay timer scheduled during a frame fires before the next one', () => {
		// This is the weapon-flicker hack: hide now, show on the next task.
		const { state, time } = fakeClock();
		const timers = new TimerService(time);
		let visible = true;

		visible = false;
		timers.after(0, () => {
			visible = true;
		});
		assert(!visible, 'still hidden for the frame that scheduled it');

		timers.update();
		assert(visible, 'restored before the following frame');
	});

	test('cancelling inside a batch prevents a later callback in the same batch', () => {
		const { state, time } = fakeClock();
		const timers = new TimerService(time);
		let ran = false;
		let handle;

		timers.after(10, () => timers.clear(handle));
		handle = timers.after(10, () => {
			ran = true;
		});

		state.now = 20;
		timers.update();
		assert(!ran, 'a cancelled timer must not fire even if it was already due');
	});

	test('clearAll drops every pending callback', () => {
		const { state, time } = fakeClock();
		const timers = new TimerService(time);
		let fired = 0;
		timers.after(10, () => ++fired);
		timers.after(20, () => ++fired);
		assertEqual(timers.pending, 2, 'both queued');

		timers.clearAll();
		state.now = 100;
		timers.update();
		assertEqual(fired, 0, 'nothing fires after teardown');
		assertEqual(timers.pending, 0, 'queue is empty');
	});
});

describe('timers: pausing', () => {
	test('pausing the clock suspends deadlines rather than deferring a burst', () => {
		const { state, time } = fakeClock();
		const timers = new TimerService(time);
		let fired = 0;
		timers.after(100, () => ++fired);

		state.now = 50;
		timers.update();
		assertEqual(fired, 0, 'not due yet');

		time.pause();
		state.now = 5000; // a long time in a pause menu
		timers.update();
		assertEqual(fired, 0, 'paused time does not count toward the deadline');

		time.resume();
		state.now = 5049; // 99ms of live time
		timers.update();
		assertEqual(fired, 0, 'the pause did not consume any of the deadline');

		state.now = 5050; // exactly 100ms of live time
		timers.update();
		assertEqual(fired, 1, 'fires once the remaining live time elapses — once, not as a burst');
	});

	test('a stopwatch reads the same elapsed time across a pause', () => {
		const { state, time } = fakeClock();
		const watch = new Stopwatch(time);

		state.now = 120;
		assertEqual(watch.getElapsedTime(), 120, 'live time accumulates');

		time.pause();
		state.now = 9000;
		assertEqual(watch.getElapsedTime(), 120, 'frozen while paused');

		time.resume();
		state.now = 9030;
		assertEqual(watch.getElapsedTime(), 150, 'resumes without a jump');
	});

	test('add() rewinds the start time, as the jump-hold window relies on', () => {
		const { state, time } = fakeClock();
		const watch = new Stopwatch(time);
		watch.add(10000);
		assertEqual(watch.getElapsedTime(), 10000, 'pretends the time already passed');
		watch.restart();
		assertEqual(watch.getElapsedTime(), 0, 'restart clears it');
	});
});
