# @artworkdev/cqrs

Standalone CQRS, DDD and outbox primitives.

This package is framework-agnostic. It does not depend on Nest, decorators,
`reflect-metadata`, RxJS or Bun at runtime.

## Commands

```ts
import { Command, CommandBus, type CommandHandler } from '@artworkdev/cqrs';

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

## Queries

```ts
import { Query, QueryBus, type QueryHandler } from '@artworkdev/cqrs';

type UserProfileViewModel = {
	id: string;
	email: string;
};

class RetrieveUserProfileQuery extends Query<UserProfileViewModel> {
	constructor(readonly userId: string) {
		super();
	}
}

class RetrieveUserProfileQueryHandler
	implements QueryHandler<RetrieveUserProfileQuery, UserProfileViewModel>
{
	async execute(
		query: RetrieveUserProfileQuery,
	): Promise<UserProfileViewModel> {
		return {
			id: query.userId,
			email: 'alice@example.com',
		};
	}
}

const queryBus = new QueryBus();

queryBus.register(
	RetrieveUserProfileQuery,
	new RetrieveUserProfileQueryHandler(),
);

const profile = await queryBus.execute(
	new RetrieveUserProfileQuery('user-1'),
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
