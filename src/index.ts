import { Command } from './core/command/Command.js';
import { CommandBus } from './core/command/CommandBus.js';
import {
	CommandHandlerAlreadyRegisteredError,
	CommandHandlerNotFoundError,
} from './core/command/CommandErrors.js';
import { CommandRegistry } from './core/command/CommandRegistry.js';
import { Event } from './core/event/Event.js';
import { EventBus } from './core/event/EventBus.js';
import { EventHandlerExecutionError } from './core/event/EventErrors.js';
import { EventRegistry } from './core/event/EventRegistry.js';
import { Query } from './core/query/Query.js';
import { QueryBus } from './core/query/QueryBus.js';
import {
	QueryHandlerAlreadyRegisteredError,
	QueryHandlerNotFoundError,
} from './core/query/QueryErrors.js';
import { QueryRegistry } from './core/query/QueryRegistry.js';
import { AggregateRoot } from './ddd/AggregateRoot.js';
import { DomainEvent } from './ddd/DomainEvent.js';
import { EventBusDomainEventPublisher } from './outbox/DomainEventPublisher.js';
import { InMemoryOutboxRepository } from './outbox/InMemoryOutboxRepository.js';
import { OutboxEventRegistry } from './outbox/OutboxEventRegistry.js';
import {
	OutboxEventAlreadyRegisteredError,
	OutboxEventNotRegisteredError,
} from './outbox/OutboxEventRegistryErrors.js';
import { OutboxMessageFactory } from './outbox/OutboxMessageFactory.js';
import { OutboxProcessor } from './outbox/OutboxProcessor.js';
import { RegisteredOutboxMessageDeserializer } from './outbox/RegisteredOutboxMessageDeserializer.js';
import { RegisteredOutboxMessageSerializer } from './outbox/RegisteredOutboxMessageSerializer.js';
import { NoopTransactionPerformer } from './transaction/NoopTransactionPerformer.js';

export type {
	CommandConstructor,
	CommandHandler,
} from './core/command/Command.js';
export type {
	EventConstructor,
	EventHandler,
} from './core/event/Event.js';
export type { EventHandlerExecutionFailure } from './core/event/EventErrors.js';
export type { QueryConstructor, QueryHandler } from './core/query/Query.js';
export type { DomainEventPublisher } from './outbox/DomainEventPublisher.js';
export type {
	DomainEventConstructor,
	OutboxEventRegistration,
	RegisteredOutboxEvent,
} from './outbox/OutboxEventRegistry.js';
export * from './outbox/OutboxMessage.js';
export type {
	Clock,
	CreateOutboxMessageParams,
	DomainEventSerializer,
	IdGenerator,
	OutboxMessageFactoryDependencies,
} from './outbox/OutboxMessageFactory.js';
export type {
	OutboxMessageDeserializer,
	OutboxProcessFailure,
	OutboxProcessorDependencies,
	OutboxProcessResult,
	ProcessPendingOutboxMessagesParams,
} from './outbox/OutboxProcessor.js';
export type {
	FindPendingOutboxMessagesParams,
	OutboxRepository,
} from './outbox/OutboxRepository.js';
export type {
	TransactionableAsync,
	TransactionPerformer,
} from './transaction/Transaction.js';
export {
	AggregateRoot,
	Command,
	CommandBus,
	CommandHandlerAlreadyRegisteredError,
	CommandHandlerNotFoundError,
	CommandRegistry,
	DomainEvent,
	Event,
	EventBus,
	EventBusDomainEventPublisher,
	EventHandlerExecutionError,
	EventRegistry,
	InMemoryOutboxRepository,
	NoopTransactionPerformer,
	OutboxEventAlreadyRegisteredError,
	OutboxEventNotRegisteredError,
	OutboxEventRegistry,
	OutboxMessageFactory,
	OutboxProcessor,
	Query,
	QueryBus,
	QueryHandlerAlreadyRegisteredError,
	QueryHandlerNotFoundError,
	QueryRegistry,
	RegisteredOutboxMessageDeserializer,
	RegisteredOutboxMessageSerializer,
};
