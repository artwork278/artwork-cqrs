import type { Command, CommandConstructor, CommandHandler } from './Command.js';
import { CommandHandlerAlreadyRegisteredError } from './CommandErrors.js';

export class CommandRegistry {
	private readonly handlers = new Map<CommandConstructor, CommandHandler>();

	register<TCommand extends Command<unknown>, TResult>(
		command: CommandConstructor<TCommand>,
		handler: CommandHandler<TCommand, TResult>,
	): void {
		if (this.handlers.has(command)) {
			throw new CommandHandlerAlreadyRegisteredError(command);
		}

		this.handlers.set(command, handler as CommandHandler);
	}

	retrieve<TCommand extends Command<unknown>, TResult>(
		command: CommandConstructor<TCommand>,
	): CommandHandler<TCommand, TResult> | undefined {
		return this.handlers.get(command) as
			| CommandHandler<TCommand, TResult>
			| undefined;
	}
}
