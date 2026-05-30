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
	EventHandlerExecutionError,
	EventRegistry,
	Query,
	QueryBus,
	QueryHandlerAlreadyRegisteredError,
	QueryHandlerNotFoundError,
	QueryRegistry,
};
