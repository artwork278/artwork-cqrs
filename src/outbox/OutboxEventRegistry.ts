import type { DomainEvent } from '../ddd/DomainEvent.js';
import {
	OutboxEventAlreadyRegisteredError,
	OutboxEventNotRegisteredError,
} from './OutboxEventRegistryErrors.js';
import type {
	OutboxMessageMetadata,
	OutboxMessagePayload,
} from './OutboxMessage.js';
import type { SerializedOutboxEvent } from './OutboxMessageFactory.js';

export type DomainEventConstructor<TEvent extends DomainEvent = DomainEvent> = {
	readonly name: string;
	readonly prototype: TEvent;
};

export interface OutboxEventRegistration<
	TEvent extends DomainEvent = DomainEvent,
> {
	readonly eventName: string;
	readonly eventVersion: number;
	serialize(event: TEvent): OutboxMessagePayload;
	retrieveMetadata?(event: TEvent): OutboxMessageMetadata;
	deserialize(payload: OutboxMessagePayload): Promise<TEvent> | TEvent;
}

export type RegisteredOutboxEvent = {
	readonly eventName: string;
	readonly eventVersion: number;
	serialize(event: DomainEvent): SerializedOutboxEvent;
	deserialize(
		payload: OutboxMessagePayload,
	): Promise<DomainEvent> | DomainEvent;
};

export type RetrieveOutboxEventRegistrationParams = {
	readonly eventName: string;
	readonly eventVersion: number;
};

export class OutboxEventRegistry {
	private readonly registrations = new Map<string, RegisteredOutboxEvent>();
	private readonly eventKeysByConstructor = new Map<
		DomainEventConstructor,
		string
	>();

	register<TEvent extends DomainEvent>(
		eventConstructor: DomainEventConstructor<TEvent>,
		registration: OutboxEventRegistration<TEvent>,
	): void {
		const eventKey = createEventKey({
			eventName: registration.eventName,
			eventVersion: registration.eventVersion,
		});

		if (
			this.registrations.has(eventKey) ||
			this.eventKeysByConstructor.has(eventConstructor)
		) {
			throw new OutboxEventAlreadyRegisteredError(
				registration.eventName,
				registration.eventVersion,
			);
		}

		this.eventKeysByConstructor.set(eventConstructor, eventKey);
		this.registrations.set(eventKey, {
			eventName: registration.eventName,
			eventVersion: registration.eventVersion,
			serialize: (event) => ({
				eventName: registration.eventName,
				eventVersion: registration.eventVersion,
				payload: registration.serialize(event as TEvent),
				...registration.retrieveMetadata?.(event as TEvent),
			}),
			deserialize: (payload) => registration.deserialize(payload),
		});
	}

	retrieve(
		params: RetrieveOutboxEventRegistrationParams,
	): RegisteredOutboxEvent {
		const registration = this.registrations.get(createEventKey(params));

		if (!registration) {
			throw new OutboxEventNotRegisteredError(
				params.eventName,
				params.eventVersion,
			);
		}

		return registration;
	}

	retrieveByConstructor(
		eventConstructor: DomainEventConstructor,
	): RegisteredOutboxEvent {
		const eventKey = this.eventKeysByConstructor.get(eventConstructor);

		if (!eventKey) {
			throw new OutboxEventNotRegisteredError(eventConstructor.name);
		}

		const registration = this.registrations.get(eventKey);

		if (!registration) {
			throw new OutboxEventNotRegisteredError(eventConstructor.name);
		}

		return registration;
	}
}

const createEventKey = ({
	eventName,
	eventVersion,
}: RetrieveOutboxEventRegistrationParams): string =>
	`${eventName}@${eventVersion}`;
