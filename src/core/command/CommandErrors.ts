import type { Command, CommandConstructor } from './Command.js';

export class CommandHandlerAlreadyRegisteredError extends Error {
	constructor(command: CommandConstructor) {
		super(`Command handler already registered for "${command.name}".`);
		this.name = 'CommandHandlerAlreadyRegisteredError';
	}
}

export class CommandHandlerNotFoundError extends Error {
	constructor(command: Command<unknown>) {
		super(
			`Command handler not found for "${command.constructor.name}". Register it before executing the command.`,
		);
		this.name = 'CommandHandlerNotFoundError';
	}
}
