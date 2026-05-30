import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import {
	SqliteAsyncTransactionBlockError,
	SqliteTransactionPerformer,
} from '../../../src/adapters/sqlite';

describe('SqliteTransactionPerformer', () => {
	test('commits a successful transaction', async () => {
		const database = new Database(':memory:');
		const transactionPerformer = new SqliteTransactionPerformer(database);

		database.run('CREATE TABLE users (id TEXT PRIMARY KEY)');

		await transactionPerformer.perform(({ database }) => {
			database.query('INSERT INTO users (id) VALUES (?)').run('user-1');
		});

		expect(
			database.query('SELECT id FROM users').all() as { id: string }[],
		).toEqual([{ id: 'user-1' }]);

		database.close();
	});

	test('rolls back a failed transaction', async () => {
		const database = new Database(':memory:');
		const transactionPerformer = new SqliteTransactionPerformer(database);

		database.run('CREATE TABLE users (id TEXT PRIMARY KEY)');

		await expect(
			transactionPerformer.perform(({ database }) => {
				database.query('INSERT INTO users (id) VALUES (?)').run('user-1');

				throw new Error('Transaction failed.');
			}),
		).rejects.toThrow('Transaction failed.');

		expect(
			database.query('SELECT id FROM users').all() as { id: string }[],
		).toEqual([]);

		database.close();
	});

	test('rejects async transaction blocks', async () => {
		const database = new Database(':memory:');
		const transactionPerformer = new SqliteTransactionPerformer(database);

		await expect(
			transactionPerformer.perform(async () => undefined),
		).rejects.toThrow(SqliteAsyncTransactionBlockError);

		database.close();
	});
});
