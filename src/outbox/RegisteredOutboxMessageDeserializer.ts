import type { DomainEvent } from '../ddd/DomainEvent.js';
import type { OutboxEventRegistry } from './OutboxEventRegistry.js';
import type { OutboxMessage } from './OutboxMessage.js';
import type { OutboxMessageDeserializer } from './OutboxProcessor.js';

export class RegisteredOutboxMessageDeserializer
	implements OutboxMessageDeserializer<DomainEvent>
{
	constructor(private readonly registry: OutboxEventRegistry) {}

	deserialize(message: OutboxMessage): Promise<DomainEvent> | DomainEvent {
		const registration = this.registry.retrieve(message.eventName);

		return registration.deserialize(message.payload);
	}
}
