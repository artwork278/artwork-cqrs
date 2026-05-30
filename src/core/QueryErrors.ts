import type { Query, QueryConstructor } from './Query.js';

export class QueryHandlerAlreadyRegisteredError extends Error {
	constructor(query: QueryConstructor) {
		super(`Query handler already registered for "${query.name}".`);
		this.name = 'QueryHandlerAlreadyRegisteredError';
	}
}

export class QueryHandlerNotFoundError extends Error {
	constructor(query: Query<unknown>) {
		super(
			`Query handler not found for "${query.constructor.name}". Register it before executing the query.`,
		);
		this.name = 'QueryHandlerNotFoundError';
	}
}
