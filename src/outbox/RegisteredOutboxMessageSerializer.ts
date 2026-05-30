import type { DomainEvent } from '../ddd/DomainEvent.js';
import type {
	DomainEventConstructor,
	OutboxEventRegistry,
} from './OutboxEventRegistry.js';
import type {
	DomainEventSerializer,
	SerializedOutboxEvent,
} from './OutboxMessageFactory.js';

export class RegisteredOutboxMessageSerializer
	implements DomainEventSerializer<DomainEvent>
{
	constructor(private readonly registry: OutboxEventRegistry) {}

	serialize(event: DomainEvent): SerializedOutboxEvent {
		const eventConstructor = event.constructor as DomainEventConstructor;
		const registration = this.registry.retrieveByConstructor(eventConstructor);

		return registration.serialize(event);
	}
}
