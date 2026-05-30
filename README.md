# @artwork/cqrs

Standalone CQRS, DDD and outbox primitives.

This package is framework-agnostic. It does not depend on Nest, decorators,
`reflect-metadata`, RxJS or Bun at runtime.

## Commands

```ts
import { Command, CommandBus, type CommandHandler } from '@artwork/cqrs';

class RegisterUserCommand extends Command {
	constructor(
		readonly userId: string,
		readonly email: string,
	) {
		super();
	}
}

class RegisterUserCommandHandler
	implements CommandHandler<RegisterUserCommand, void>
{
	async execute(command: RegisterUserCommand): Promise<void> {
		// Persist user, collect domain events, save outbox messages, etc.
	}
}

const commandBus = new CommandBus();

commandBus.register(RegisterUserCommand, new RegisterUserCommandHandler());

await commandBus.execute(
	new RegisterUserCommand('user-1', 'alice@example.com'),
);
```

## Development

```bash
bun install
```

```bash
bun test
bun run typecheck
bun run build
```
