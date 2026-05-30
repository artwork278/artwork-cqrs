import { describe, expect, test } from 'bun:test';
import {
	DomainEvent,
	type DomainEventPublisher,
	EventBus,
	EventBusDomainEventPublisher,
	InMemoryOutboxRepository,
	NoopTransactionPerformer,
	OutboxEventRegistry,
	type OutboxMessage,
	OutboxMessageStatus,
	OutboxProcessor,
	RegisteredOutboxMessageDeserializer,
} from '../../src';

class UserRegisteredDomainEvent extends DomainEvent {
	constructor(readonly userId: string) {
		super();
	}
}

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

const fixedClock = {
	now: (): Date => updatedAt,
};

const createMessage = (id: string): OutboxMessage => ({
	id,
	eventName: 'user.registered',
	eventVersion: 1,
	payload: {
		userId: 'user-1',
	},
	occurredAt: createdAt,
	status: OutboxMessageStatus.PENDING,
	attempts: 0,
	createdAt,
	updatedAt: createdAt,
});

class RecordingDomainEventPublisher
	implements DomainEventPublisher<UserRegisteredDomainEvent>
{
	readonly events: UserRegisteredDomainEvent[] = [];

	publish(event: UserRegisteredDomainEvent): void {
		this.events.push(event);
	}
}

class FailingDomainEventPublisher
	implements DomainEventPublisher<UserRegisteredDomainEvent>
{
	publish(): void {
		throw new Error('Publish failed.');
	}
}

describe('OutboxProcessor', () => {
	test('publishes pending messages and marks them as published', async () => {
		const outboxRepository = new InMemoryOutboxRepository(fixedClock);
		const transactionPerformer = new NoopTransactionPerformer();
		const domainEventPublisher = new RecordingDomainEventPublisher();
		const registry = new OutboxEventRegistry();

		registry.register(UserRegisteredDomainEvent, {
			eventName: 'user.registered',
			eventVersion: 1,
			serialize: (event) => ({
				userId: event.userId,
			}),
			deserialize: (payload) =>
				new UserRegisteredDomainEvent(String(payload.userId)),
		});

		const processor = new OutboxProcessor({
			outboxRepository,
			transactionPerformer,
			domainEventPublisher,
			deserializer: new RegisteredOutboxMessageDeserializer(registry),
		});

		await transactionPerformer.perform(
			outboxRepository.append(createMessage('message-1')),
		);

		const result = await processor.processPending();

		expect(result).toEqual({
			attempted: 1,
			published: 1,
			failed: 0,
			failures: [],
		});
		expect(domainEventPublisher.events).toEqual([
			new UserRegisteredDomainEvent('user-1'),
		]);
		expect(outboxRepository.findAll()).toEqual([
			{
				...createMessage('message-1'),
				status: OutboxMessageStatus.PUBLISHED,
				updatedAt,
				publishedAt: updatedAt,
				error: undefined,
				failedAt: undefined,
			},
		]);
	});

	test('marks a message as failed when publication fails', async () => {
		const outboxRepository = new InMemoryOutboxRepository(fixedClock);
		const transactionPerformer = new NoopTransactionPerformer();
		const processor = new OutboxProcessor({
			outboxRepository,
			transactionPerformer,
			domainEventPublisher: new FailingDomainEventPublisher(),
			deserializer: {
				deserialize: (message) =>
					new UserRegisteredDomainEvent(String(message.payload.userId)),
			},
		});

		await transactionPerformer.perform(
			outboxRepository.append(createMessage('message-1')),
		);

		const result = await processor.processPending();

		expect(result.attempted).toBe(1);
		expect(result.published).toBe(0);
		expect(result.failed).toBe(1);
		expect(result.failures).toHaveLength(1);
		expect(outboxRepository.findAll()).toEqual([
			{
				...createMessage('message-1'),
				status: OutboxMessageStatus.FAILED,
				attempts: 1,
				updatedAt,
				failedAt: updatedAt,
				error: 'Publish failed.',
			},
		]);
	});

	test('publishes domain events through an EventBus adapter', async () => {
		const eventBus = new EventBus();
		const publisher = new EventBusDomainEventPublisher(eventBus);
		const handledEvents: UserRegisteredDomainEvent[] = [];

		eventBus.register(UserRegisteredDomainEvent, {
			handle: (event) => {
				handledEvents.push(event);
			},
		});

		await publisher.publish(new UserRegisteredDomainEvent('user-1'));

		expect(handledEvents).toEqual([new UserRegisteredDomainEvent('user-1')]);
	});
});
