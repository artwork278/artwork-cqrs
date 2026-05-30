import type { DomainEvent } from '../ddd/DomainEvent.js';
import {
	type OutboxMessage,
	type OutboxMessagePayload,
	OutboxMessageStatus,
} from './OutboxMessage.js';

export interface Clock {
	now(): Date;
}

export interface IdGenerator {
	generate(): string;
}

export interface DomainEventSerializer<
	TEvent extends DomainEvent = DomainEvent,
> {
	serialize(event: TEvent): OutboxMessagePayload;
}

export type CreateOutboxMessageParams<
	TEvent extends DomainEvent = DomainEvent,
> = {
	readonly event: TEvent;
};

export type OutboxMessageFactoryDependencies<
	TEvent extends DomainEvent = DomainEvent,
> = {
	readonly clock: Clock;
	readonly idGenerator: IdGenerator;
	readonly serializer: DomainEventSerializer<TEvent>;
};

export class OutboxMessageFactory<TEvent extends DomainEvent = DomainEvent> {
	constructor(
		private readonly dependencies: OutboxMessageFactoryDependencies<TEvent>,
	) {}

	create(params: CreateOutboxMessageParams<TEvent>): OutboxMessage {
		const now = this.dependencies.clock.now();

		return {
			id: this.dependencies.idGenerator.generate(),
			eventName: params.event.constructor.name,
			payload: this.dependencies.serializer.serialize(params.event),
			occurredAt: now,
			status: OutboxMessageStatus.PENDING,
			attempts: 0,
			createdAt: now,
			updatedAt: now,
		};
	}

	createMany(events: readonly TEvent[]): readonly OutboxMessage[] {
		return events.map((event) => this.create({ event }));
	}
}
