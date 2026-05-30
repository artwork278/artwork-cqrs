import {
	type OutboxMessage,
	type OutboxMessagePayload,
	OutboxMessageStatus,
} from '../../outbox/OutboxMessage.js';
import type { Clock } from '../../outbox/OutboxMessageFactory.js';
import type {
	FindPendingOutboxMessagesParams,
	OutboxRepository,
} from '../../outbox/OutboxRepository.js';
import type { TransactionableAsync } from '../../transaction/Transaction.js';
import {
	SqliteOutboxPayloadParseError,
	SqliteOutboxStatusParseError,
} from './SqliteOutboxRepositoryErrors.js';
import type {
	SqliteDatabase,
	SqliteTransactionContext,
} from './SqliteTypes.js';

const systemClock: Clock = {
	now: (): Date => new Date(),
};

type SqliteOutboxMessageRow = {
	readonly id: string;
	readonly event_name: string;
	readonly event_version: number;
	readonly payload: string;
	readonly occurred_at: string;
	readonly status: string;
	readonly attempts: number;
	readonly created_at: string;
	readonly updated_at: string;
	readonly published_at: string | null;
	readonly failed_at: string | null;
	readonly error: string | null;
	readonly aggregate_id: string | null;
	readonly aggregate_type: string | null;
	readonly correlation_id: string | null;
	readonly causation_id: string | null;
};

export type SqliteOutboxRepositoryDependencies = {
	readonly database: SqliteDatabase;
	readonly clock?: Clock;
};

export class SqliteOutboxRepository
	implements OutboxRepository<SqliteTransactionContext>
{
	constructor(
		private readonly dependencies: SqliteOutboxRepositoryDependencies,
	) {}

	initialize(): void {
		this.dependencies.database.run(`
			CREATE TABLE IF NOT EXISTS outbox_messages (
				id TEXT PRIMARY KEY,
				event_name TEXT NOT NULL,
				event_version INTEGER NOT NULL,
				payload TEXT NOT NULL,
				occurred_at TEXT NOT NULL,
				status TEXT NOT NULL,
				attempts INTEGER NOT NULL,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL,
				published_at TEXT,
				failed_at TEXT,
				error TEXT,
				aggregate_id TEXT,
				aggregate_type TEXT,
				correlation_id TEXT,
				causation_id TEXT
			)
		`);
		this.dependencies.database.run(`
			CREATE INDEX IF NOT EXISTS outbox_messages_status_created_at_idx
			ON outbox_messages (status, created_at)
		`);
		this.dependencies.database.run(`
			CREATE INDEX IF NOT EXISTS outbox_messages_event_idx
			ON outbox_messages (event_name, event_version)
		`);
	}

	append(
		message: OutboxMessage,
	): TransactionableAsync<void, SqliteTransactionContext> {
		return ({ database }) => {
			insertMessage(database, message);
		};
	}

	appendMany(
		messages: readonly OutboxMessage[],
	): TransactionableAsync<void, SqliteTransactionContext> {
		return ({ database }) => {
			messages.forEach((message) => {
				insertMessage(database, message);
			});
		};
	}

	findPending(
		params: FindPendingOutboxMessagesParams = {},
	): readonly OutboxMessage[] {
		const limit = params.limit ?? Number.MAX_SAFE_INTEGER;
		const rows = this.dependencies.database
			.query(`
				SELECT *
				FROM outbox_messages
				WHERE status = ?
				ORDER BY created_at ASC
				LIMIT ?
			`)
			.all(OutboxMessageStatus.PENDING, limit) as SqliteOutboxMessageRow[];

		return rows.map(toOutboxMessage);
	}

	markPublished(
		id: string,
	): TransactionableAsync<void, SqliteTransactionContext> {
		return ({ database }) => {
			const now = this.retrieveClock().now().toISOString();

			database
				.query(`
					UPDATE outbox_messages
					SET
						status = ?,
						updated_at = ?,
						published_at = ?,
						failed_at = NULL,
						error = NULL
					WHERE id = ?
				`)
				.run(OutboxMessageStatus.PUBLISHED, now, now, id);
		};
	}

	markFailed(
		id: string,
		error: unknown,
	): TransactionableAsync<void, SqliteTransactionContext> {
		return ({ database }) => {
			const now = this.retrieveClock().now().toISOString();

			database
				.query(`
					UPDATE outbox_messages
					SET
						status = ?,
						attempts = attempts + 1,
						updated_at = ?,
						failed_at = ?,
						error = ?
					WHERE id = ?
				`)
				.run(
					OutboxMessageStatus.FAILED,
					now,
					now,
					retrieveErrorMessage(error),
					id,
				);
		};
	}

	private retrieveClock(): Clock {
		return this.dependencies.clock ?? systemClock;
	}
}

const insertMessage = (
	database: SqliteDatabase,
	message: OutboxMessage,
): void => {
	database
		.query(`
			INSERT INTO outbox_messages (
				id,
				event_name,
				event_version,
				payload,
				occurred_at,
				status,
				attempts,
				created_at,
				updated_at,
				published_at,
				failed_at,
				error,
				aggregate_id,
				aggregate_type,
				correlation_id,
				causation_id
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`)
		.run(
			message.id,
			message.eventName,
			message.eventVersion,
			JSON.stringify(message.payload),
			message.occurredAt.toISOString(),
			message.status,
			message.attempts,
			message.createdAt.toISOString(),
			message.updatedAt.toISOString(),
			message.publishedAt?.toISOString() ?? null,
			message.failedAt?.toISOString() ?? null,
			message.error ?? null,
			message.aggregateId ?? null,
			message.aggregateType ?? null,
			message.correlationId ?? null,
			message.causationId ?? null,
		);
};

const toOutboxMessage = (row: SqliteOutboxMessageRow): OutboxMessage => ({
	id: row.id,
	eventName: row.event_name,
	eventVersion: row.event_version,
	payload: parsePayload(row),
	occurredAt: new Date(row.occurred_at),
	status: parseStatus(row),
	attempts: row.attempts,
	createdAt: new Date(row.created_at),
	updatedAt: new Date(row.updated_at),
	publishedAt: row.published_at ? new Date(row.published_at) : undefined,
	failedAt: row.failed_at ? new Date(row.failed_at) : undefined,
	error: row.error ?? undefined,
	aggregateId: row.aggregate_id ?? undefined,
	aggregateType: row.aggregate_type ?? undefined,
	correlationId: row.correlation_id ?? undefined,
	causationId: row.causation_id ?? undefined,
});

const parsePayload = (row: SqliteOutboxMessageRow): OutboxMessagePayload => {
	const payload = JSON.parse(row.payload) as unknown;

	if (!isRecord(payload)) throw new SqliteOutboxPayloadParseError(row.id);

	return payload;
};

const parseStatus = (row: SqliteOutboxMessageRow): OutboxMessage['status'] => {
	if (
		row.status === OutboxMessageStatus.PENDING ||
		row.status === OutboxMessageStatus.PUBLISHED ||
		row.status === OutboxMessageStatus.FAILED
	) {
		return row.status;
	}

	throw new SqliteOutboxStatusParseError(row.id, row.status);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const retrieveErrorMessage = (error: unknown): string => {
	if (error instanceof Error) return error.message;

	return String(error);
};
