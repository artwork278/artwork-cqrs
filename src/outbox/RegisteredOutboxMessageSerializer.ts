import type { DomainEvent } from '../ddd/DomainEvent.js';
import type { OutboxEventRegistry } from './OutboxEventRegistry.js';
import type { OutboxMessagePayload } from './OutboxMessage.js';
import type { DomainEventSerializer } from './OutboxMessageFactory.js';

export class RegisteredOutboxMessageSerializer
	implements DomainEventSerializer<DomainEvent>
{
	constructor(private readonly registry: OutboxEventRegistry) {}

	serialize(event: DomainEvent): OutboxMessagePayload {
		const eventName = event.constructor.name;
		const registration = this.registry.retrieve(eventName);

		return registration.serialize(event);
	}
}
