import { describe, expect, test } from 'bun:test';
import {
	type Clock,
	InMemoryOutboxRepository,
	NoopTransactionPerformer,
	type OutboxMessage,
	OutboxMessageStatus,
	type TransactionableAsync,
} from '../../src';

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
	},
	occurredAt: createdAt,
	status: params.status ?? OutboxMessageStatus.PENDING,
	attempts: 0,
	createdAt,
	updatedAt: createdAt,
});

const perform = async (block: TransactionableAsync): Promise<void> => {
	const transactionPerformer = new NoopTransactionPerformer();

	await transactionPerformer.perform(block);
};

describe('InMemoryOutboxRepository', () => {
	test('appends and finds pending messages', async () => {
		const repository = new InMemoryOutboxRepository(fixedClock);

		await perform(repository.append(createMessage({ id: 'message-1' })));
		await perform(
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
	});

	test('appends many messages and applies a pending limit', async () => {
		const repository = new InMemoryOutboxRepository(fixedClock);

		await perform(
			repository.appendMany([
				createMessage({ id: 'message-1' }),
				createMessage({ id: 'message-2' }),
			]),
		);

		expect(repository.findPending({ limit: 1 })).toEqual([
			createMessage({ id: 'message-1' }),
		]);
	});

	test('marks a message as published', async () => {
		const repository = new InMemoryOutboxRepository(fixedClock);

		await perform(repository.append(createMessage({ id: 'message-1' })));
		await perform(repository.markPublished('message-1'));

		expect(repository.findAll()).toEqual([
			{
				...createMessage({ id: 'message-1' }),
				status: OutboxMessageStatus.PUBLISHED,
				updatedAt,
				publishedAt: updatedAt,
				error: undefined,
				failedAt: undefined,
			},
		]);
	});

	test('marks a message as failed', async () => {
		const repository = new InMemoryOutboxRepository(fixedClock);

		await perform(repository.append(createMessage({ id: 'message-1' })));
		await perform(
			repository.markFailed('message-1', new Error('Publish failed.')),
		);

		expect(repository.findAll()).toEqual([
			{
				...createMessage({ id: 'message-1' }),
				status: OutboxMessageStatus.FAILED,
				attempts: 1,
				updatedAt,
				failedAt: updatedAt,
				error: 'Publish failed.',
			},
		]);
	});

	test('clears all messages', async () => {
		const repository = new InMemoryOutboxRepository(fixedClock);

		await perform(repository.append(createMessage({ id: 'message-1' })));
		repository.clear();

		expect(repository.findAll()).toEqual([]);
	});
});
