import { Command } from './core/Command.js';
import { CommandBus } from './core/CommandBus.js';
import {
	CommandHandlerAlreadyRegisteredError,
	CommandHandlerNotFoundError,
} from './core/CommandErrors.js';
import { CommandRegistry } from './core/CommandRegistry.js';
import { Query } from './core/Query.js';
import { QueryBus } from './core/QueryBus.js';
import {
	QueryHandlerAlreadyRegisteredError,
	QueryHandlerNotFoundError,
} from './core/QueryErrors.js';
import { QueryRegistry } from './core/QueryRegistry.js';

export type { CommandConstructor, CommandHandler } from './core/Command.js';
export type { QueryConstructor, QueryHandler } from './core/Query.js';
export {
	Command,
	CommandBus,
	CommandHandlerAlreadyRegisteredError,
	CommandHandlerNotFoundError,
	CommandRegistry,
	Query,
	QueryBus,
	QueryHandlerAlreadyRegisteredError,
	QueryHandlerNotFoundError,
	QueryRegistry,
};
