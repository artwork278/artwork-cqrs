import type { Database, SQLQueryBindings } from 'bun:sqlite';

export type SqliteBinding = SQLQueryBindings;

export type SqliteDatabase = Database;

export type SqliteStatement = ReturnType<Database['query']>;

export type SqliteTransactionRunner<TResult> = {
	(): TResult;
	deferred(): TResult;
	immediate(): TResult;
	exclusive(): TResult;
};

export type SqliteTransactionContext = {
	readonly database: SqliteDatabase;
};
