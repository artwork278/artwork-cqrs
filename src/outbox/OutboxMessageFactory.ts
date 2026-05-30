import type { DomainEvent } from '../ddd/DomainEvent.js';
import {
	type OutboxMessage,
	type OutboxMessageMetadata,
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
	serialize(event: TEvent): SerializedOutboxEvent;
}

export type SerializedOutboxEvent = {
	readonly eventName: string;
	readonly eventVersion: number;
	readonly payload: OutboxMessagePayload;
} & OutboxMessageMetadata;

export type CreateOutboxMessageParams<
	TEvent extends DomainEvent = DomainEvent,
> = {
	readonly event: TEvent;
	readonly metadata?: OutboxMessageMetadata;
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
		const serializedEvent = this.dependencies.serializer.serialize(
			params.event,
		);
		const metadata = retrieveMessageMetadata({
			serializedEvent,
			metadata: params.metadata,
		});

		return {
			id: this.dependencies.idGenerator.generate(),
			eventName: serializedEvent.eventName,
			eventVersion: serializedEvent.eventVersion,
			payload: serializedEvent.payload,
			occurredAt: now,
			status: OutboxMessageStatus.PENDING,
			attempts: 0,
			createdAt: now,
			updatedAt: now,
			...metadata,
		};
	}

	createMany(events: readonly TEvent[]): readonly OutboxMessage[] {
		return events.map((event) => this.create({ event }));
	}
}

type RetrieveMessageMetadataParams = {
	readonly serializedEvent: SerializedOutboxEvent;
	readonly metadata?: OutboxMessageMetadata;
};

const retrieveMessageMetadata = ({
	serializedEvent,
	metadata,
}: RetrieveMessageMetadataParams): OutboxMessageMetadata => ({
	...(serializedEvent.aggregateId === undefined
		? {}
		: { aggregateId: serializedEvent.aggregateId }),
	...(serializedEvent.aggregateType === undefined
		? {}
		: { aggregateType: serializedEvent.aggregateType }),
	...(serializedEvent.correlationId === undefined
		? {}
		: { correlationId: serializedEvent.correlationId }),
	...(serializedEvent.causationId === undefined
		? {}
		: { causationId: serializedEvent.causationId }),
	...(metadata?.aggregateId === undefined
		? {}
		: { aggregateId: metadata.aggregateId }),
	...(metadata?.aggregateType === undefined
		? {}
		: { aggregateType: metadata.aggregateType }),
	...(metadata?.correlationId === undefined
		? {}
		: { correlationId: metadata.correlationId }),
	...(metadata?.causationId === undefined
		? {}
		: { causationId: metadata.causationId }),
});
