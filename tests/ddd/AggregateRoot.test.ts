import { describe, expect, test } from 'bun:test';
import { AggregateRoot, DomainEvent } from '../../src';

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

class UserAggregate extends AggregateRoot {
	id = '';
	email = '';

	register(params: { readonly userId: string; readonly email: string }): void {
		this.apply(new UserRegisteredDomainEvent(params.userId, params.email));
	}

	changeEmail(email: string): void {
		this.apply(new UserEmailChangedDomainEvent(email));
	}

	protected onUserRegisteredDomainEvent(
		event: UserRegisteredDomainEvent,
	): void {
		this.id = event.userId;
		this.email = event.email;
	}

	protected onUserEmailChangedDomainEvent(
		event: UserEmailChangedDomainEvent,
	): void {
		this.email = event.email;
	}
}

describe('AggregateRoot', () => {
	test('records domain events when applying a new event', () => {
		const user = new UserAggregate();

		user.register({
			userId: 'user-1',
			email: 'alice@example.com',
		});

		expect(user.id).toBe('user-1');
		expect(user.email).toBe('alice@example.com');
		expect(user.getDomainEvents()).toEqual([
			new UserRegisteredDomainEvent('user-1', 'alice@example.com'),
		]);
	});

	test('pulls and clears domain events', () => {
		const user = new UserAggregate();

		user.register({
			userId: 'user-1',
			email: 'alice@example.com',
		});

		const events = user.pullDomainEvents();

		expect(events).toEqual([
			new UserRegisteredDomainEvent('user-1', 'alice@example.com'),
		]);
		expect(user.getDomainEvents()).toEqual([]);
	});

	test('clears domain events without returning them', () => {
		const user = new UserAggregate();

		user.register({
			userId: 'user-1',
			email: 'alice@example.com',
		});

		user.clearDomainEvents();

		expect(user.getDomainEvents()).toEqual([]);
	});

	test('loads state from history without recording domain events', () => {
		const user = new UserAggregate();

		user.loadFromHistory([
			new UserRegisteredDomainEvent('user-1', 'alice@example.com'),
			new UserEmailChangedDomainEvent('alice.updated@example.com'),
		]);

		expect(user.id).toBe('user-1');
		expect(user.email).toBe('alice.updated@example.com');
		expect(user.getDomainEvents()).toEqual([]);
	});

	test('applies an event without invoking the matching handler', () => {
		const user = new UserAggregate();

		user.apply(new UserRegisteredDomainEvent('user-1', 'alice@example.com'), {
			skipHandler: true,
		});

		expect(user.id).toBe('');
		expect(user.email).toBe('');
		expect(user.getDomainEvents()).toEqual([
			new UserRegisteredDomainEvent('user-1', 'alice@example.com'),
		]);
	});
});
