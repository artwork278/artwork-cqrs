import { describe, expect, test } from 'bun:test';
import {
	Command,
	CommandBus,
	type CommandHandler,
	CommandHandlerAlreadyRegisteredError,
	CommandHandlerNotFoundError,
} from '../../src';

class RegisterUserCommand extends Command {
	constructor(
		readonly userId: string,
		readonly email: string,
	) {
		super();
	}
}

class RetrieveCommandIdCommand extends Command<string> {
	constructor(readonly commandId: string) {
		super();
	}
}

class RegisterUserCommandHandler
	implements CommandHandler<RegisterUserCommand, void>
{
	readonly handledUserIds: string[] = [];

	execute(command: RegisterUserCommand): void {
		this.handledUserIds.push(command.userId);
	}
}

class RetrieveCommandIdCommandHandler
	implements CommandHandler<RetrieveCommandIdCommand, string>
{
	execute(command: RetrieveCommandIdCommand): string {
		return command.commandId;
	}
}

describe('CommandBus', () => {
	test('executes a registered command handler', async () => {
		const commandBus = new CommandBus();
		const handler = new RegisterUserCommandHandler();

		commandBus.register(RegisterUserCommand, handler);

		await commandBus.execute(
			new RegisterUserCommand('user-1', 'alice@example.com'),
		);

		expect(handler.handledUserIds).toEqual(['user-1']);
	});

	test('returns the command handler result', async () => {
		const commandBus = new CommandBus();

		commandBus.register(
			RetrieveCommandIdCommand,
			new RetrieveCommandIdCommandHandler(),
		);

		const result = await commandBus.execute(
			new RetrieveCommandIdCommand('command-1'),
		);

		expect(result).toBe('command-1');
	});

	test('throws when no command handler is registered', async () => {
		const commandBus = new CommandBus();

		expect(
			commandBus.execute(
				new RegisterUserCommand('user-1', 'alice@example.com'),
			),
		).rejects.toBeInstanceOf(CommandHandlerNotFoundError);
	});

	test('throws when a command handler is already registered', () => {
		const commandBus = new CommandBus();
		const handler = new RegisterUserCommandHandler();

		commandBus.register(RegisterUserCommand, handler);

		expect(() => commandBus.register(RegisterUserCommand, handler)).toThrow(
			CommandHandlerAlreadyRegisteredError,
		);
	});
});
