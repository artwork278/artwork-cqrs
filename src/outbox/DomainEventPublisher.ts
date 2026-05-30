import type { EventBus } from '../core/event/EventBus.js';
import type { DomainEvent } from '../ddd/DomainEvent.js';

export interface DomainEventPublisher<
	TEvent extends DomainEvent = DomainEvent,
> {
	publish(event: TEvent): Promise<void> | void;
}

export class EventBusDomainEventPublisher
	implements DomainEventPublisher<DomainEvent>
{
	constructor(private readonly eventBus: EventBus) {}

	async publish(event: DomainEvent): Promise<void> {
		await this.eventBus.publish(event);
	}
}
