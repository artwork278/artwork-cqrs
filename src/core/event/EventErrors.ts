import type { Event } from './Event.js';

export type EventHandlerExecutionFailure = {
	readonly event: Event;
	readonly error: unknown;
};

export class EventHandlerExecutionError extends Error {
	constructor(readonly failures: readonly EventHandlerExecutionFailure[]) {
		super(`One or more event handlers failed: ${failures.length}.`);
		this.name = 'EventHandlerExecutionError';
	}
}
