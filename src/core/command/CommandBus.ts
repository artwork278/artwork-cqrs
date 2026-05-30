import type { Command, CommandConstructor } from './Command.js';
import { CommandHandlerNotFoundError } from './CommandErrors.js';
import { CommandRegistry } from './CommandRegistry.js';

export class CommandBus {
	constructor(
		private readonly registry: CommandRegistry = new CommandRegistry(),
	) {}

	register<TCommand extends Command<unknown>, TResult>(
		command: CommandConstructor<TCommand>,
		handler: {
			execute(command: TCommand): Promise<TResult> | TResult;
		},
	): void {
		this.registry.register(command, handler);
	}

	async execute<TCommand extends Command<TResult>, TResult>(
		command: TCommand,
	): Promise<TResult> {
		const commandConstructor =
			command.constructor as CommandConstructor<TCommand>;
		const handler = this.registry.retrieve<TCommand, TResult>(
			commandConstructor,
		);

		if (!handler) throw new CommandHandlerNotFoundError(command);

		return handler.execute(command);
	}
}
