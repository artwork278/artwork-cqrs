export const QUERY_RESULT_TYPE_SYMBOL: unique symbol = Symbol(
	'QUERY_RESULT_TYPE_SYMBOL',
);

export abstract class Query<TResult> {
	declare readonly [QUERY_RESULT_TYPE_SYMBOL]: TResult;
}

export type QueryConstructor<TQuery extends Query<unknown> = Query<unknown>> = {
	readonly name: string;
	readonly prototype: TQuery;
};

export interface QueryHandler<
	TQuery extends Query<unknown> = Query<unknown>,
	TResult = TQuery extends Query<infer TInferredResult>
		? TInferredResult
		: never,
> {
	execute(query: TQuery): Promise<TResult> | TResult;
}
