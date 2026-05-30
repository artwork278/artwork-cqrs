import type { Event, EventConstructor, EventHandler } from './Event.js';

export class EventRegistry {
	private readonly handlers = new Map<EventConstructor, EventHandler[]>();

	register<TEvent extends Event>(
		event: EventConstructor<TEvent>,
		handler: EventHandler<TEvent>,
	): void {
		const handlers = this.handlers.get(event) ?? [];

		this.handlers.set(event, [...handlers, handler as EventHandler]);
	}

	retrieve<TEvent extends Event>(
		event: EventConstructor<TEvent>,
	): readonly EventHandler<TEvent>[] {
		return (this.handlers.get(event) ?? []) as EventHandler<TEvent>[];
	}
}
