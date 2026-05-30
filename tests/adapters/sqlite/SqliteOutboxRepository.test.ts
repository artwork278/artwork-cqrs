import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import {
	type Clock,
	type OutboxMessage,
	OutboxMessageStatus,
} from '../../../src';
import {
	SqliteOutboxRepository,
	SqliteTransactionPerformer,
} from '../../../src/adapters/sqlite';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

const fixedClock: Clock = {
	now: () => updatedAt,
};

const createMessage = (params: {
	readonly id: string;
	readonly status?: OutboxMessage['status'];
}): OutboxMessage => ({
	id: params.id,
	eventName: 'user.registered',
	eventVersion: 1,
	payload: {
		userId: 'user-1',
		email: 'alice@example.com',
	},
	occurredAt: createdAt,
	status: params.status ?? OutboxMessageStatus.PENDING,
	attempts: 0,
	createdAt,
	updatedAt: createdAt,
	aggregateId: 'user-1',
	aggregateType: 'user',
	correlationId: 'correlation-1',
	causationId: 'command-1',
});

const createRepository = (): {
	readonly database: Database;
	readonly repository: SqliteOutboxRepository;
	readonly transactionPerformer: SqliteTransactionPerformer;
} => {
	const database = new Database(':memory:');
	const repository = new SqliteOutboxRepository({
		database,
		clock: fixedClock,
	});
	const transactionPerformer = new SqliteTransactionPerformer(database);

	repository.initialize();

	return {
		database,
		repository,
		transactionPerformer,
	};
};

describe('SqliteOutboxRepository', () => {
	test('appends and finds pending messages', async () => {
		const { database, repository, transactionPerformer } = createRepository();

		await transactionPerformer.perform(
			repository.append(createMessage({ id: 'message-1' })),
		);
		await transactionPerformer.perform(
			repository.append(
				createMessage({
					id: 'message-2',
					status: OutboxMessageStatus.PUBLISHED,
				}),
			),
		);

		expect(repository.findPending()).toEqual([
			createMessage({ id: 'message-1' }),
		]);

		database.close();
	});

	test('appends many messages and applies a pending limit', async () => {
		const { database, repository, transactionPerformer } = createRepository();

		await transactionPerformer.perform(
			repository.appendMany([
				createMessage({ id: 'message-1' }),
				createMessage({ id: 'message-2' }),
			]),
		);

		expect(repository.findPending({ limit: 1 })).toEqual([
			createMessage({ id: 'message-1' }),
		]);

		database.close();
	});

	test('marks a message as published', async () => {
		const { database, repository, transactionPerformer } = createRepository();

		await transactionPerformer.perform(
			repository.append(createMessage({ id: 'message-1' })),
		);
		await transactionPerformer.perform(repository.markPublished('message-1'));

		expect(repository.findPending()).toEqual([]);
		expect(
			database
				.query('SELECT status, published_at FROM outbox_messages WHERE id = ?')
				.get('message-1') as { status: string; published_at: string | null },
		).toEqual({
			status: OutboxMessageStatus.PUBLISHED,
			published_at: updatedAt.toISOString(),
		});

		database.close();
	});

	test('marks a message as failed', async () => {
		const { database, repository, transactionPerformer } = createRepository();

		await transactionPerformer.perform(
			repository.append(createMessage({ id: 'message-1' })),
		);
		await transactionPerformer.perform(
			repository.markFailed('message-1', new Error('Publish failed.')),
		);

		expect(
			database
				.query(
					'SELECT status, attempts, failed_at, error FROM outbox_messages WHERE id = ?',
				)
				.get('message-1') as {
				status: string;
				attempts: number;
				failed_at: string | null;
				error: string | null;
			},
		).toEqual({
			status: OutboxMessageStatus.FAILED,
			attempts: 1,
			failed_at: updatedAt.toISOString(),
			error: 'Publish failed.',
		});

		database.close();
	});
});
