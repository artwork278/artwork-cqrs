import type {
	TransactionableAsync,
	TransactionPerformer,
} from '../../transaction/Transaction.js';
import { SqliteAsyncTransactionBlockError } from './SqliteTransactionErrors.js';
import type {
	SqliteDatabase,
	SqliteTransactionContext,
} from './SqliteTypes.js';

export class SqliteTransactionPerformer
	implements TransactionPerformer<SqliteTransactionContext>
{
	constructor(private readonly database: SqliteDatabase) {}

	async perform<TResult>(
		block: TransactionableAsync<TResult, SqliteTransactionContext>,
	): Promise<TResult> {
		const transaction = this.database.transaction(() => {
			const result = block({ database: this.database });

			if (isPromiseLike(result)) {
				throw new SqliteAsyncTransactionBlockError();
			}

			return result;
		});

		return transaction.immediate();
	}
}

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
	typeof value === 'object' &&
	value !== null &&
	'then' in value &&
	typeof value.then === 'function';
