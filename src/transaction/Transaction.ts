export type TransactionableAsync<TResult = void, TTransaction = void> = (
	transaction: TTransaction,
) => Promise<TResult> | TResult;

export interface TransactionPerformer<TTransaction = void> {
	perform<TResult>(
		block: TransactionableAsync<TResult, TTransaction>,
	): Promise<TResult>;
}
