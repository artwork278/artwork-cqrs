export const COMMAND_RESULT_TYPE_SYMBOL: unique symbol = Symbol(
	'COMMAND_RESULT_TYPE_SYMBOL',
);

export abstract class Command<TResult = void> {
	declare readonly [COMMAND_RESULT_TYPE_SYMBOL]: TResult;
}

export type CommandConstructor<
	TCommand extends Command<unknown> = Command<unknown>,
> = {
	readonly name: string;
	readonly prototype: TCommand;
};

export interface CommandHandler<
	TCommand extends Command<unknown> = Command<unknown>,
	TResult = TCommand extends Command<infer TInferredResult>
		? TInferredResult
		: never,
> {
	execute(command: TCommand): Promise<TResult> | TResult;
}
