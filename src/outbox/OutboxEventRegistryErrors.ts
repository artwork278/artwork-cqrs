export class OutboxEventAlreadyRegisteredError extends Error {
	constructor(
		readonly eventName: string,
		readonly eventVersion?: number,
	) {
		super(
			eventVersion === undefined
				? `Outbox event already registered: ${eventName}`
				: `Outbox event already registered: ${eventName}@${eventVersion}`,
		);
		this.name = 'OutboxEventAlreadyRegisteredError';
	}
}

export class OutboxEventNotRegisteredError extends Error {
	constructor(
		readonly eventName: string,
		readonly eventVersion?: number,
	) {
		super(
			eventVersion === undefined
				? `Outbox event not registered: ${eventName}`
				: `Outbox event not registered: ${eventName}@${eventVersion}`,
		);
		this.name = 'OutboxEventNotRegisteredError';
	}
}
