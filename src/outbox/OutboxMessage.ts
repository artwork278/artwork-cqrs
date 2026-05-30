export const OutboxMessageStatus = Object.freeze({
	PENDING: 'pending',
	PUBLISHED: 'published',
	FAILED: 'failed',
} as const);

export type OutboxMessageStatus =
	(typeof OutboxMessageStatus)[keyof typeof OutboxMessageStatus];

export type OutboxMessagePayload = Record<string, unknown>;

export type OutboxMessage = {
	readonly id: string;
	readonly eventName: string;
	readonly payload: OutboxMessagePayload;
	readonly occurredAt: Date;
	readonly status: OutboxMessageStatus;
	readonly attempts: number;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly publishedAt?: Date;
	readonly failedAt?: Date;
	readonly error?: string;
};
