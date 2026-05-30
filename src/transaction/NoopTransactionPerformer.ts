import type {
	TransactionableAsync,
	TransactionPerformer,
} from './Transaction.js';

export class NoopTransactionPerformer implements TransactionPerformer {
	async perform<TResult>(
		block: TransactionableAsync<TResult>,
	): Promise<TResult> {
		return block(undefined);
	}
}
