export class SqliteAsyncTransactionBlockError extends Error {
	constructor() {
		super(
			'SQLite transaction blocks must be synchronous. Run async work before opening the SQLite transaction.',
		);
		this.name = 'SqliteAsyncTransactionBlockError';
	}
}
