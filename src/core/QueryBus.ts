import type { Query, QueryConstructor } from './Query.js';
import { QueryHandlerNotFoundError } from './QueryErrors.js';
import { QueryRegistry } from './QueryRegistry.js';

export class QueryBus {
	constructor(private readonly registry: QueryRegistry = new QueryRegistry()) {}

	register<TQuery extends Query<unknown>, TResult>(
		query: QueryConstructor<TQuery>,
		handler: {
			execute(query: TQuery): Promise<TResult> | TResult;
		},
	): void {
		this.registry.register(query, handler);
	}

	async execute<TQuery extends Query<TResult>, TResult>(
		query: TQuery,
	): Promise<TResult> {
		const queryConstructor = query.constructor as QueryConstructor<TQuery>;
		const handler = this.registry.retrieve<TQuery, TResult>(queryConstructor);

		if (!handler) throw new QueryHandlerNotFoundError(query);

		return handler.execute(query);
	}
}
