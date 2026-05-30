import { describe, expect, test } from 'bun:test';
import {
	Event,
	EventBus,
	type EventHandler,
	EventHandlerExecutionError,
} from '../../src';

class UserRegisteredEvent extends Event {
	constructor(readonly userId: string) {
		super();
	}
}

class UserEmailChangedEvent extends Event {
	constructor(readonly userId: string) {
		super();
	}
}

class RecordUserRegisteredEventHandler
	implements EventHandler<UserRegisteredEvent>
{
	readonly handledUserIds: string[] = [];

	handle(event: UserRegisteredEvent): void {
		this.handledUserIds.push(event.userId);
	}
}

class FailingUserRegisteredEventHandler
	implements EventHandler<UserRegisteredEvent>
{
	handle(): void {
		throw new Error('Handler failed.');
	}
}

describe('EventBus', () => {
	test('publishes an event to all registered handlers', async () => {
		const eventBus = new EventBus();
		const firstHandler = new RecordUserRegisteredEventHandler();
		const secondHandler = new RecordUserRegisteredEventHandler();

		eventBus.register(UserRegisteredEvent, firstHandler);
		eventBus.register(UserRegisteredEvent, secondHandler);

		await eventBus.publish(new UserRegisteredEvent('user-1'));

		expect(firstHandler.handledUserIds).toEqual(['user-1']);
		expect(secondHandler.handledUserIds).toEqual(['user-1']);
	});

	test('does not throw when no event handler is registered', async () => {
		const eventBus = new EventBus();

		await expect(
			eventBus.publish(new UserRegisteredEvent('user-1')),
		).resolves.toBeUndefined();
	});

	test('publishes multiple events', async () => {
		const eventBus = new EventBus();
		const userRegisteredHandler = new RecordUserRegisteredEventHandler();
		const userEmailChangedHandler = new RecordUserRegisteredEventHandler();

		eventBus.register(UserRegisteredEvent, userRegisteredHandler);
		eventBus.register(UserEmailChangedEvent, userEmailChangedHandler);

		await eventBus.publishAll([
			new UserRegisteredEvent('user-1'),
			new UserEmailChangedEvent('user-2'),
		]);

		expect(userRegisteredHandler.handledUserIds).toEqual(['user-1']);
		expect(userEmailChangedHandler.handledUserIds).toEqual(['user-2']);
	});

	test('throws an execution error when an event handler fails', async () => {
		const eventBus = new EventBus();
		const successfulHandler = new RecordUserRegisteredEventHandler();

		eventBus.register(UserRegisteredEvent, successfulHandler);
		eventBus.register(
			UserRegisteredEvent,
			new FailingUserRegisteredEventHandler(),
		);

		try {
			await eventBus.publish(new UserRegisteredEvent('user-1'));
			throw new Error('Expected EventHandlerExecutionError.');
		} catch (error) {
			expect(error).toBeInstanceOf(EventHandlerExecutionError);

			const executionError = error as EventHandlerExecutionError;

			expect(executionError.failures).toHaveLength(1);
			expect(successfulHandler.handledUserIds).toEqual(['user-1']);
		}
	});
});
