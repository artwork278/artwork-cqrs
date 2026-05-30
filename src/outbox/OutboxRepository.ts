import type { OutboxMessage } from './OutboxMessage.js';

export type FindPendingOutboxMessagesParams = {
	readonly limit?: number;
};

export interface OutboxRepository {
	append(message: OutboxMessage): Promise<void> | void;
	appendMany(messages: readonly OutboxMessage[]): Promise<void> | void;
	findPending(
		params?: FindPendingOutboxMessagesParams,
	): Promise<readonly OutboxMessage[]> | readonly OutboxMessage[];
	markPublished(id: string): Promise<void> | void;
	markFailed(id: string, error: unknown): Promise<void> | void;
}
