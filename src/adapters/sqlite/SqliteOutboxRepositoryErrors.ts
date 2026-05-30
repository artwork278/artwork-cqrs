export class SqliteOutboxPayloadParseError extends Error {
	constructor(readonly messageId: string) {
		super(
			`SQLite outbox payload is invalid JSON object for message: ${messageId}`,
		);
		this.name = 'SqliteOutboxPayloadParseError';
	}
}

export class SqliteOutboxStatusParseError extends Error {
	constructor(
		readonly messageId: string,
		readonly status: string,
	) {
		super(
			`SQLite outbox status is invalid for message ${messageId}: ${status}`,
		);
		this.name = 'SqliteOutboxStatusParseError';
	}
}
