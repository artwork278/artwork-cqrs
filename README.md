# @artworkdev/cqrs

Standalone CQRS primitives for TypeScript applications.

`@artworkdev/cqrs` provides framework-agnostic command, query and event buses.
It is inspired by `@nestjs/cqrs`, but intentionally avoids Nest, decorators,
`reflect-metadata`, RxJS and runtime dependency injection.

## Status

The current `main` branch targets `0.4.0`.

Published package:

```bash
bun add @artworkdev/cqrs
```

Available primitives:

- `CommandBus` for application writes.
- `QueryBus` for application reads.
- `EventBus` for in-process event handlers.
- `AggregateRoot` and `DomainEvent` for domain event collection.
- `TransactionPerformer` and `TransactionableAsync` for explicit transaction
  boundaries.
- `OutboxRepository`, `OutboxMessageFactory` and `OutboxProcessor` for
  transaction-aware outbox workflows.
- `DomainEventPublisher` and `EventBusDomainEventPublisher` for post-outbox
  domain event publication.

## Design Rules

- Commands and queries use `execute`.
- Events use `publish` and `publishAll`.
- Registration is explicit, not decorator-based.
- Commands and queries have one handler.
- Events can have zero, one or many handlers.
- A missing command/query handler is an error.
- A missing event handler is not an error.
- The library does not own transactions. Application code must keep aggregate
  persistence and outbox writes atomic.
- Outbox writes return transactionable operations. The use case decides which
  transaction executes them.

## Commands

A command represents an application write intent. In strict CQRS, command
handlers should usually return `void`. Technical IDs such as `commandId`,
`jobId` or `correlationId` are acceptable when the caller needs them.

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
		// Persist the aggregate here.
	}
}

const commandBus = new CommandBus();

commandBus.register(RegisterUserCommand, new RegisterUserCommandHandler());

await commandBus.execute(
	new RegisterUserCommand('user-1', 'alice@example.com'),
);
```

### Command Errors

`CommandBus.execute()` throws:

- `CommandHandlerNotFoundError` when no handler is registered.
- `CommandHandlerAlreadyRegisteredError` when registering a second handler for
  the same command constructor.

## Queries

A query represents an application read intent. Query handlers should return a
read model or view model, not a mutable domain aggregate.

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

### Query Errors

`QueryBus.execute()` throws:

- `QueryHandlerNotFoundError` when no handler is registered.
- `QueryHandlerAlreadyRegisteredError` when registering a second handler for
  the same query constructor.

## Events

An event represents something that already happened. Events can be observed by
multiple handlers. Publishing an event with no registered handler is valid.

```ts
import {
	Event,
	EventBus,
	type EventHandler,
	EventHandlerExecutionError,
} from '@artworkdev/cqrs';

class UserRegisteredEvent extends Event {
	constructor(readonly userId: string) {
		super();
	}
}

class SendWelcomeEmailEventHandler
	implements EventHandler<UserRegisteredEvent>
{
	async handle(event: UserRegisteredEvent): Promise<void> {
		// Send a welcome email, enqueue a job, update a projection, etc.
	}
}

const eventBus = new EventBus();

eventBus.register(
	UserRegisteredEvent,
	new SendWelcomeEmailEventHandler(),
);

await eventBus.publish(new UserRegisteredEvent('user-1'));
```

Publish multiple events:

```ts
await eventBus.publishAll([
	new UserRegisteredEvent('user-1'),
	new UserRegisteredEvent('user-2'),
]);
```

### Event Errors

`EventBus` does not fail when no handler is registered.

If one or more handlers throw, `EventBus` throws
`EventHandlerExecutionError`. The error exposes `failures`, so callers can
inspect which events failed and why.

```ts
try {
	await eventBus.publish(new UserRegisteredEvent('user-1'));
} catch (error) {
	if (error instanceof EventHandlerExecutionError) {
		for (const failure of error.failures) {
			// failure.event
			// failure.error
		}
	}
}
```

## Domain Events

`AggregateRoot` records domain events produced by domain behavior. It does not
know about `EventBus`, outbox persistence, transactions or infrastructure.
It is intentionally not generic over the full list of event types: forcing
every aggregate to maintain a large event union makes real aggregates noisy.
Keep event-specific typing inside the aggregate methods and `on<EventName>`
handlers instead.

```ts
import { AggregateRoot, DomainEvent } from '@artworkdev/cqrs';

class UserRegisteredDomainEvent extends DomainEvent {
	constructor(
		readonly userId: string,
		readonly email: string,
	) {
		super();
	}
}

class User extends AggregateRoot {
	id = '';
	email = '';

	register(params: { readonly userId: string; readonly email: string }): void {
		this.apply(
			new UserRegisteredDomainEvent(params.userId, params.email),
		);
	}

	protected onUserRegisteredDomainEvent(
		event: UserRegisteredDomainEvent,
	): void {
		this.id = event.userId;
		this.email = event.email;
	}
}

const user = new User();

user.register({
	userId: 'user-1',
	email: 'alice@example.com',
});

const events = user.pullDomainEvents();
```

`apply()` records new events and invokes a matching internal handler named
`on<EventClassName>` when it exists.

```ts
this.apply(new UserRegisteredDomainEvent('user-1', 'alice@example.com'));
```

`loadFromHistory()` replays events into the aggregate without recording them as
new events.

```ts
user.loadFromHistory(previousEvents);
```

Use `pullDomainEvents()` after persistence to collect and clear pending events.
Use `getDomainEvents()` only for inspection.

## Outbox

The outbox primitives define how domain events become durable messages. The
library provides the contract and a memory implementation for tests; production
storage belongs to your application.

```ts
import {
	InMemoryOutboxRepository,
	NoopTransactionPerformer,
	OutboxMessageFactory,
	type DomainEventSerializer,
	type Clock,
	type IdGenerator,
} from '@artworkdev/cqrs';

const fixedClock: Clock = {
	now: () => new Date('2026-01-01T00:00:00.000Z'),
};

const idGenerator: IdGenerator = {
	generate: () => 'outbox-message-1',
};

const serializer: DomainEventSerializer<UserRegisteredDomainEvent> = {
	serialize: (event) => ({
		userId: event.userId,
		email: event.email,
	}),
};

const outboxMessageFactory =
	new OutboxMessageFactory<UserRegisteredDomainEvent>({
		clock: fixedClock,
		idGenerator,
		serializer,
	});

const outboxRepository = new InMemoryOutboxRepository(fixedClock);
const transactionPerformer = new NoopTransactionPerformer();
const messages = outboxMessageFactory.createMany(events);

await transactionPerformer.perform(outboxRepository.appendMany(messages));
```

### Repository Contract

`OutboxRepository` is intentionally small, but write operations are
transaction-aware:

```ts
type TransactionableAsync<TResult = void, TTransaction = void> = (
	transaction: TTransaction,
) => Promise<TResult> | TResult;

interface OutboxRepository<TTransaction = void> {
	append(message: OutboxMessage): TransactionableAsync<void, TTransaction>;
	appendMany(
		messages: readonly OutboxMessage[],
	): TransactionableAsync<void, TTransaction>;
	findPending(params?: { readonly limit?: number }):
		| Promise<readonly OutboxMessage[]>
		| readonly OutboxMessage[];
	markPublished(id: string): TransactionableAsync<void, TTransaction>;
	markFailed(
		id: string,
		error: unknown,
	): TransactionableAsync<void, TTransaction>;
}
```

`InMemoryOutboxRepository` is for tests and local development only. It is not a
durable outbox.

### Transaction Boundary

The use case owns the transaction. This is the important bit:

```ts
await transactionPerformer.perform(async (transaction) => {
	await userRepository.save(user)(transaction);

	const events = user.pullDomainEvents();
	const messages = outboxMessageFactory.createMany(events);

	await outboxRepository.appendMany(messages)(transaction);
});
```

Do not hide transaction boundaries inside the bus. If aggregate persistence and
outbox writes are not atomic, the outbox gives a false sense of reliability.

### Processing Pending Messages

`OutboxProcessor` reads pending messages, deserializes them into domain events,
publishes them, then marks the message as published or failed.

```ts
import {
	EventBus,
	EventBusDomainEventPublisher,
	OutboxProcessor,
} from '@artworkdev/cqrs';

const eventBus = new EventBus();

const processor = new OutboxProcessor({
	outboxRepository,
	transactionPerformer,
	domainEventPublisher: new EventBusDomainEventPublisher(eventBus),
	deserializer: {
		deserialize: (message) => {
			if (message.eventName !== 'UserRegisteredDomainEvent') {
				throw new Error(`Unknown event: ${message.eventName}`);
			}

			return new UserRegisteredDomainEvent(
				String(message.payload.userId),
				String(message.payload.email),
			);
		},
	},
});

const result = await processor.processPending({ limit: 100 });
```

`OutboxProcessor` publishes messages sequentially. That is deliberate for v1:
it keeps retry and failure semantics simple. Parallel processing belongs in an
application-level worker once locking, leases and concurrency limits are known.

## EventBus vs DomainEventPublisher

`EventBus` is the low-level in-process publication mechanism. It finds
registered handlers and calls them.

`DomainEventPublisher` is a port for publishing a domain event after it has
left the outbox. `EventBusDomainEventPublisher` is the built-in adapter that
publishes through `EventBus`.

The correct shape is:

```ts
await transactionPerformer.perform(async (transaction) => {
	await userRepository.save(user)(transaction);
	await outboxRepository.appendMany(messages)(transaction);
});

await outboxProcessor.processPending();
```

## Public API

```ts
export {
	Command,
	CommandBus,
	CommandHandlerAlreadyRegisteredError,
	CommandHandlerNotFoundError,
	CommandRegistry,
	Event,
	EventBus,
	EventBusDomainEventPublisher,
	EventHandlerExecutionError,
	EventRegistry,
	InMemoryOutboxRepository,
	NoopTransactionPerformer,
	OutboxMessageFactory,
	OutboxProcessor,
	OutboxMessageStatus,
	AggregateRoot,
	DomainEvent,
	Query,
	QueryBus,
	QueryHandlerAlreadyRegisteredError,
	QueryHandlerNotFoundError,
	QueryRegistry,
};

export type {
	CommandConstructor,
	CommandHandler,
	EventConstructor,
	EventHandler,
	EventHandlerExecutionFailure,
	Clock,
	DomainEventPublisher,
	DomainEventSerializer,
	FindPendingOutboxMessagesParams,
	IdGenerator,
	OutboxMessage,
	OutboxMessageDeserializer,
	OutboxMessageFactoryDependencies,
	OutboxMessagePayload,
	OutboxProcessFailure,
	OutboxProcessResult,
	OutboxProcessorDependencies,
	OutboxRepository,
	ProcessPendingOutboxMessagesParams,
	QueryConstructor,
	QueryHandler,
	TransactionableAsync,
	TransactionPerformer,
};
```

## Development

Use Bun for local development.

```bash
bun install
bun run validate
bun run build
bun run pack:dry-run
```

Useful scripts:

- `bun test`
- `bun run check`
- `bun run typecheck`
- `bun run build`
- `bun run publish:dry-run`
