import type { TransactionableAsync } from '../transaction/Transaction.js';
import type { OutboxMessage } from './OutboxMessage.js';

export type FindPendingOutboxMessagesParams = {
	readonly limit?: number;
};

export interface OutboxRepository<TTransaction = void> {
	append(message: OutboxMessage): TransactionableAsync<void, TTransaction>;
	appendMany(
		messages: readonly OutboxMessage[],
	): TransactionableAsync<void, TTransaction>;
	findPending(
		params?: FindPendingOutboxMessagesParams,
	): Promise<readonly OutboxMessage[]> | readonly OutboxMessage[];
	markPublished(id: string): TransactionableAsync<void, TTransaction>;
	markFailed(
		id: string,
		error: unknown,
	): TransactionableAsync<void, TTransaction>;
}
