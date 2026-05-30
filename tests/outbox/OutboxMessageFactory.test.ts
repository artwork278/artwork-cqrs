import { describe, expect, test } from 'bun:test';
import {
	type Clock,
	DomainEvent,
	type DomainEventSerializer,
	type IdGenerator,
	OutboxMessageFactory,
	OutboxMessageStatus,
} from '../../src';

class UserRegisteredDomainEvent extends DomainEvent {
	constructor(
		readonly userId: string,
		readonly email: string,
	) {
		super();
	}
}

const fixedDate = new Date('2026-01-01T00:00:00.000Z');

const fixedClock: Clock = {
	now: () => fixedDate,
};

const fixedIdGenerator: IdGenerator = {
	generate: () => 'outbox-message-1',
};

const serializer: DomainEventSerializer<UserRegisteredDomainEvent> = {
	serialize: (event) => ({
		userId: event.userId,
		email: event.email,
	}),
};

describe('OutboxMessageFactory', () => {
	test('creates an outbox message from a domain event', () => {
		const factory = new OutboxMessageFactory({
			clock: fixedClock,
			idGenerator: fixedIdGenerator,
			serializer,
		});

		const message = factory.create({
			event: new UserRegisteredDomainEvent('user-1', 'alice@example.com'),
		});

		expect(message).toEqual({
			id: 'outbox-message-1',
			eventName: 'UserRegisteredDomainEvent',
			payload: {
				userId: 'user-1',
				email: 'alice@example.com',
			},
			occurredAt: fixedDate,
			status: OutboxMessageStatus.PENDING,
			attempts: 0,
			createdAt: fixedDate,
			updatedAt: fixedDate,
		});
	});

	test('creates multiple outbox messages', () => {
		let nextId = 0;
		const factory = new OutboxMessageFactory({
			clock: fixedClock,
			idGenerator: {
				generate: () => `outbox-message-${++nextId}`,
			},
			serializer,
		});

		const messages = factory.createMany([
			new UserRegisteredDomainEvent('user-1', 'alice@example.com'),
			new UserRegisteredDomainEvent('user-2', 'bob@example.com'),
		]);

		expect(messages.map((message) => message.id)).toEqual([
			'outbox-message-1',
			'outbox-message-2',
		]);
	});
});
