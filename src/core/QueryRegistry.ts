import type { Query, QueryConstructor, QueryHandler } from './Query.js';
import { QueryHandlerAlreadyRegisteredError } from './QueryErrors.js';

export class QueryRegistry {
	private readonly handlers = new Map<QueryConstructor, QueryHandler>();

	register<TQuery extends Query<unknown>, TResult>(
		query: QueryConstructor<TQuery>,
		handler: QueryHandler<TQuery, TResult>,
	): void {
		if (this.handlers.has(query)) {
			throw new QueryHandlerAlreadyRegisteredError(query);
		}

		this.handlers.set(query, handler as QueryHandler);
	}

	retrieve<TQuery extends Query<unknown>, TResult>(
		query: QueryConstructor<TQuery>,
	): QueryHandler<TQuery, TResult> | undefined {
		return this.handlers.get(query) as
			| QueryHandler<TQuery, TResult>
			| undefined;
	}
}
