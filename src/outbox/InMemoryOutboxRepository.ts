import { type OutboxMessage, OutboxMessageStatus } from './OutboxMessage.js';
import type { Clock } from './OutboxMessageFactory.js';
import type {
	FindPendingOutboxMessagesParams,
	OutboxRepository,
} from './OutboxRepository.js';

const systemClock: Clock = {
	now: (): Date => new Date(),
};

export class InMemoryOutboxRepository implements OutboxRepository {
	private readonly messages = new Map<string, OutboxMessage>();

	constructor(private readonly clock: Clock = systemClock) {}

	append(message: OutboxMessage): void {
		this.messages.set(message.id, message);
	}

	appendMany(messages: readonly OutboxMessage[]): void {
		messages.forEach((message) => {
			this.append(message);
		});
	}

	findPending(
		params: FindPendingOutboxMessagesParams = {},
	): readonly OutboxMessage[] {
		const messages = [...this.messages.values()].filter(
			(message) => message.status === OutboxMessageStatus.PENDING,
		);

		if (params.limit === undefined) return messages;

		return messages.slice(0, params.limit);
	}

	markPublished(id: string): void {
		const message = this.messages.get(id);

		if (!message) return;

		const now = this.clock.now();

		this.messages.set(id, {
			...message,
			status: OutboxMessageStatus.PUBLISHED,
			updatedAt: now,
			publishedAt: now,
			error: undefined,
			failedAt: undefined,
		});
	}

	markFailed(id: string, error: unknown): void {
		const message = this.messages.get(id);

		if (!message) return;

		const now = this.clock.now();

		this.messages.set(id, {
			...message,
			status: OutboxMessageStatus.FAILED,
			attempts: message.attempts + 1,
			updatedAt: now,
			failedAt: now,
			error: retrieveErrorMessage(error),
		});
	}

	findAll(): readonly OutboxMessage[] {
		return [...this.messages.values()];
	}

	clear(): void {
		this.messages.clear();
	}
}

const retrieveErrorMessage = (error: unknown): string => {
	if (error instanceof Error) return error.message;

	return String(error);
};
