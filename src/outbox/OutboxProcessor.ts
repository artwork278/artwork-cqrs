import type { DomainEvent } from '../ddd/DomainEvent.js';
import type { TransactionPerformer } from '../transaction/Transaction.js';
import type { DomainEventPublisher } from './DomainEventPublisher.js';
import type { OutboxMessage } from './OutboxMessage.js';
import type {
	FindPendingOutboxMessagesParams,
	OutboxRepository,
} from './OutboxRepository.js';

export interface OutboxMessageDeserializer<
	TEvent extends DomainEvent = DomainEvent,
> {
	deserialize(message: OutboxMessage): Promise<TEvent> | TEvent;
}

export type ProcessPendingOutboxMessagesParams =
	FindPendingOutboxMessagesParams;

export type OutboxProcessFailure = {
	readonly message: OutboxMessage;
	readonly error: unknown;
};

export type OutboxProcessResult = {
	readonly attempted: number;
	readonly published: number;
	readonly failed: number;
	readonly failures: readonly OutboxProcessFailure[];
};

export type OutboxProcessorDependencies<
	TEvent extends DomainEvent = DomainEvent,
	TTransaction = void,
> = {
	readonly outboxRepository: OutboxRepository<TTransaction>;
	readonly transactionPerformer: TransactionPerformer<TTransaction>;
	readonly domainEventPublisher: DomainEventPublisher<TEvent>;
	readonly deserializer: OutboxMessageDeserializer<TEvent>;
};

export class OutboxProcessor<
	TEvent extends DomainEvent = DomainEvent,
	TTransaction = void,
> {
	constructor(
		private readonly dependencies: OutboxProcessorDependencies<
			TEvent,
			TTransaction
		>,
	) {}

	async processPending(
		params: ProcessPendingOutboxMessagesParams = {},
	): Promise<OutboxProcessResult> {
		const messages =
			await this.dependencies.outboxRepository.findPending(params);
		const failures: OutboxProcessFailure[] = [];
		let published = 0;

		for (const message of messages) {
			try {
				const event = await this.dependencies.deserializer.deserialize(message);

				await this.dependencies.domainEventPublisher.publish(event);
			} catch (error) {
				failures.push({ message, error });

				await this.dependencies.transactionPerformer.perform(
					this.dependencies.outboxRepository.markFailed(message.id, error),
				);

				continue;
			}

			await this.dependencies.transactionPerformer.perform(
				this.dependencies.outboxRepository.markPublished(message.id),
			);

			published += 1;
		}

		return {
			attempted: messages.length,
			published,
			failed: failures.length,
			failures,
		};
	}
}
