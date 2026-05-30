export const OutboxMessageStatus = Object.freeze({
	PENDING: 'pending',
	PUBLISHED: 'published',
	FAILED: 'failed',
} as const);

export type OutboxMessageStatus =
	(typeof OutboxMessageStatus)[keyof typeof OutboxMessageStatus];

export type OutboxMessagePayload = Record<string, unknown>;

export type OutboxMessageMetadata = {
	readonly aggregateId?: string;
	readonly aggregateType?: string;
	readonly correlationId?: string;
	readonly causationId?: string;
};

export type OutboxMessage = {
	readonly id: string;
	readonly eventName: string;
	readonly eventVersion: number;
	readonly payload: OutboxMessagePayload;
	readonly occurredAt: Date;
	readonly status: OutboxMessageStatus;
	readonly attempts: number;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly publishedAt?: Date;
	readonly failedAt?: Date;
	readonly error?: string;
} & OutboxMessageMetadata;
