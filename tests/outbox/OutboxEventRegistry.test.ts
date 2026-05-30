import { describe, expect, test } from 'bun:test';
import {
	DomainEvent,
	OutboxEventAlreadyRegisteredError,
	OutboxEventNotRegisteredError,
	OutboxEventRegistry,
	type OutboxMessage,
	OutboxMessageStatus,
	RegisteredOutboxMessageDeserializer,
	RegisteredOutboxMessageSerializer,
} from '../../src';

class UserRegisteredDomainEvent extends DomainEvent {
	constructor(
		readonly userId: string,
		readonly email: string,
	) {
		super();
	}
}

class UserEmailChangedDomainEvent extends DomainEvent {
	constructor(readonly email: string) {
		super();
	}
}

const occurredAt = new Date('2026-01-01T00:00:00.000Z');

const createMessage = (params: {
	readonly eventName: string;
	readonly payload: OutboxMessage['payload'];
}): OutboxMessage => ({
	id: 'message-1',
	eventName: params.eventName,
	payload: params.payload,
	occurredAt,
	status: OutboxMessageStatus.PENDING,
	attempts: 0,
	createdAt: occurredAt,
	updatedAt: occurredAt,
});

describe('OutboxEventRegistry', () => {
	test('serializes and deserializes a registered domain event', async () => {
		const registry = new OutboxEventRegistry();

		registry.register(UserRegisteredDomainEvent, {
			serialize: (event) => ({
				userId: event.userId,
				email: event.email,
			}),
			deserialize: (payload) =>
				new UserRegisteredDomainEvent(
					String(payload.userId),
					String(payload.email),
				),
		});

		const serializer = new RegisteredOutboxMessageSerializer(registry);
		const deserializer = new RegisteredOutboxMessageDeserializer(registry);
		const event = new UserRegisteredDomainEvent('user-1', 'alice@example.com');
		const payload = serializer.serialize(event);
		const deserializedEvent = await deserializer.deserialize(
			createMessage({
				eventName: 'UserRegisteredDomainEvent',
				payload,
			}),
		);

		expect(payload).toEqual({
			userId: 'user-1',
			email: 'alice@example.com',
		});
		expect(deserializedEvent).toEqual(event);
	});

	test('throws when registering the same event twice', () => {
		const registry = new OutboxEventRegistry();

		registry.register(UserRegisteredDomainEvent, {
			serialize: (event) => ({ userId: event.userId }),
			deserialize: (payload) =>
				new UserRegisteredDomainEvent(String(payload.userId), ''),
		});

		expect(() =>
			registry.register(UserRegisteredDomainEvent, {
				serialize: (event) => ({ userId: event.userId }),
				deserialize: (payload) =>
					new UserRegisteredDomainEvent(String(payload.userId), ''),
			}),
		).toThrow(OutboxEventAlreadyRegisteredError);
	});

	test('throws when serializing an unregistered event', () => {
		const registry = new OutboxEventRegistry();
		const serializer = new RegisteredOutboxMessageSerializer(registry);

		expect(() =>
			serializer.serialize(new UserEmailChangedDomainEvent('new@example.com')),
		).toThrow(OutboxEventNotRegisteredError);
	});

	test('throws when deserializing an unregistered event message', () => {
		const registry = new OutboxEventRegistry();
		const deserializer = new RegisteredOutboxMessageDeserializer(registry);

		expect(() =>
			deserializer.deserialize(
				createMessage({
					eventName: 'UnknownDomainEvent',
					payload: {},
				}),
			),
		).toThrow(OutboxEventNotRegisteredError);
	});
});
