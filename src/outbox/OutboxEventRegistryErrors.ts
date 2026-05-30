export class OutboxEventAlreadyRegisteredError extends Error {
	constructor(readonly eventName: string) {
		super(`Outbox event already registered: ${eventName}`);
		this.name = 'OutboxEventAlreadyRegisteredError';
	}
}

export class OutboxEventNotRegisteredError extends Error {
	constructor(readonly eventName: string) {
		super(`Outbox event not registered: ${eventName}`);
		this.name = 'OutboxEventNotRegisteredError';
	}
}
