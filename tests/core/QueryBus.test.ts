import { describe, expect, test } from 'bun:test';
import {
	Query,
	QueryBus,
	type QueryHandler,
	QueryHandlerAlreadyRegisteredError,
	QueryHandlerNotFoundError,
} from '../../src';

type UserProfileViewModel = {
	id: string;
	email: string;
};

class RetrieveUserProfileQuery extends Query<UserProfileViewModel> {
	constructor(readonly userId: string) {
		super();
	}
}

class RetrieveUserProfileQueryHandler
	implements QueryHandler<RetrieveUserProfileQuery, UserProfileViewModel>
{
	execute(query: RetrieveUserProfileQuery): UserProfileViewModel {
		return {
			id: query.userId,
			email: 'alice@example.com',
		};
	}
}

describe('QueryBus', () => {
	test('executes a registered query handler', async () => {
		const queryBus = new QueryBus();

		queryBus.register(
			RetrieveUserProfileQuery,
			new RetrieveUserProfileQueryHandler(),
		);

		const result = await queryBus.execute(
			new RetrieveUserProfileQuery('user-1'),
		);

		expect(result).toEqual({
			id: 'user-1',
			email: 'alice@example.com',
		});
	});

	test('throws when no query handler is registered', async () => {
		const queryBus = new QueryBus();

		expect(
			queryBus.execute(new RetrieveUserProfileQuery('user-1')),
		).rejects.toBeInstanceOf(QueryHandlerNotFoundError);
	});

	test('throws when a query handler is already registered', () => {
		const queryBus = new QueryBus();
		const handler = new RetrieveUserProfileQueryHandler();

		queryBus.register(RetrieveUserProfileQuery, handler);

		expect(() => queryBus.register(RetrieveUserProfileQuery, handler)).toThrow(
			QueryHandlerAlreadyRegisteredError,
		);
	});
});
