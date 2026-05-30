import type { DomainEvent } from '../ddd/DomainEvent.js';
import {
	OutboxEventAlreadyRegisteredError,
	OutboxEventNotRegisteredError,
} from './OutboxEventRegistryErrors.js';
import type { OutboxMessagePayload } from './OutboxMessage.js';

export type DomainEventConstructor<TEvent extends DomainEvent = DomainEvent> = {
	readonly name: string;
	readonly prototype: TEvent;
};

export interface OutboxEventRegistration<
	TEvent extends DomainEvent = DomainEvent,
> {
	serialize(event: TEvent): OutboxMessagePayload;
	deserialize(payload: OutboxMessagePayload): Promise<TEvent> | TEvent;
}

export type RegisteredOutboxEvent = {
	readonly eventName: string;
	serialize(event: DomainEvent): OutboxMessagePayload;
	deserialize(
		payload: OutboxMessagePayload,
	): Promise<DomainEvent> | DomainEvent;
};

export class OutboxEventRegistry {
	private readonly registrations = new Map<string, RegisteredOutboxEvent>();

	register<TEvent extends DomainEvent>(
		eventConstructor: DomainEventConstructor<TEvent>,
		registration: OutboxEventRegistration<TEvent>,
	): void {
		const eventName = eventConstructor.name;

		if (this.registrations.has(eventName)) {
			throw new OutboxEventAlreadyRegisteredError(eventName);
		}

		this.registrations.set(eventName, {
			eventName,
			serialize: (event) => registration.serialize(event as TEvent),
			deserialize: (payload) => registration.deserialize(payload),
		});
	}

	retrieve(eventName: string): RegisteredOutboxEvent {
		const registration = this.registrations.get(eventName);

		if (!registration) throw new OutboxEventNotRegisteredError(eventName);

		return registration;
	}
}
