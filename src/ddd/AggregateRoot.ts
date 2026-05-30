import type { DomainEvent } from './DomainEvent.js';

type ApplyOptions = {
	readonly fromHistory?: boolean;
	readonly skipHandler?: boolean;
};

export abstract class AggregateRoot {
	private readonly domainEvents: DomainEvent[] = [];

	apply(event: DomainEvent, options: ApplyOptions = {}): void {
		if (!options.fromHistory) {
			this.domainEvents.push(event);
		}

		if (!options.skipHandler) {
			this.handleEvent(event);
		}
	}

	pullDomainEvents(): readonly DomainEvent[] {
		const events = [...this.domainEvents];

		this.clearDomainEvents();

		return events;
	}

	clearDomainEvents(): void {
		this.domainEvents.length = 0;
	}

	getDomainEvents(): readonly DomainEvent[] {
		return [...this.domainEvents];
	}

	loadFromHistory(events: readonly DomainEvent[]): void {
		events.forEach((event) => {
			this.apply(event, {
				fromHistory: true,
			});
		});
	}

	private handleEvent(event: DomainEvent): void {
		const handlerName = `on${event.constructor.name}`;
		const handler = this[handlerName as keyof this];

		if (typeof handler !== 'function') return;

		handler.call(this, event);
	}
}
