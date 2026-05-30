import type { Event, EventConstructor } from './Event.js';
import {
	EventHandlerExecutionError,
	type EventHandlerExecutionFailure,
} from './EventErrors.js';
import { EventRegistry } from './EventRegistry.js';

export class EventBus {
	constructor(private readonly registry: EventRegistry = new EventRegistry()) {}

	register<TEvent extends Event>(
		event: EventConstructor<TEvent>,
		handler: {
			handle(event: TEvent): Promise<void> | void;
		},
	): void {
		this.registry.register(event, handler);
	}

	async publish<TEvent extends Event>(event: TEvent): Promise<void> {
		const eventConstructor = event.constructor as EventConstructor<TEvent>;
		const handlers = this.registry.retrieve(eventConstructor);
		const failures: EventHandlerExecutionFailure[] = [];

		await Promise.all(
			handlers.map(async (handler) => {
				try {
					await handler.handle(event);
				} catch (error) {
					failures.push({ event, error });
				}
			}),
		);

		if (failures.length > 0) {
			throw new EventHandlerExecutionError(failures);
		}
	}

	async publishAll(events: readonly Event[]): Promise<void> {
		const failures: EventHandlerExecutionFailure[] = [];

		await Promise.all(
			events.map(async (event) => {
				try {
					await this.publish(event);
				} catch (error) {
					if (error instanceof EventHandlerExecutionError) {
						failures.push(...error.failures);
						return;
					}

					failures.push({ event, error });
				}
			}),
		);

		if (failures.length > 0) {
			throw new EventHandlerExecutionError(failures);
		}
	}
}
