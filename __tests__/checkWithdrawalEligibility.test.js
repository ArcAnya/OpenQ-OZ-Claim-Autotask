const checkWithdrawalEligibility = require('../lib/checkWithdrawalEligibility');
const {
	ISSUE_DOES_NOT_EXIST,
	GITHUB_OAUTH_TOKEN_LACKS_PRIVILEGES,
	RATE_LIMITED,
	RATE_LIMITED_PAT
} = require('../errors');

const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

describe('checkWithdrawalEligibility', () => {
	let issueUrl = 'https://github.com/OpenQDev/OpenQ-TestRepo/issues/42';
	let oauthToken = 'oAuthToken';
	let payoutAddress = '0x';
	let pat = 'pat';
	let mock;
	const viewerData = {
		data: { viewer: { login: 'FlacoJones' } }
	};

	beforeAll(() => {
		mock = new MockAdapter(axios);
	});

	beforeEach(() => {
		mock.reset();
	});

	describe('checkWithdrawalEligibility Pre-Requisites', () => {
		it('should reject with ISSUE_DOES_NOT_EXIST error if issue is not found', async () => {
			// ARRANGE
			const data = { errors: [{ type: 'NOT_FOUND' }] };
			mock.onPost('https://api.github.com/graphql').reply(200, data);
			const MockOpenQContract = require('../__mocks__/MockOpenQContract');

			// ACT/ASSERT
			await expect(checkWithdrawalEligibility(issueUrl, oauthToken, pat, MockOpenQContract, payoutAddress)).rejects.toEqual(ISSUE_DOES_NOT_EXIST({ issueUrl }));
		});

		it.only('should reject with RATE_LIMITED_PAT error if result is RATE_LIMITED', async () => {
			// ARRANGE
			const data = { errors: [{ type: 'RATE_LIMITED' }] };
			mock.onPost('https://api.github.com/graphql').reply(200, data);
			const MockOpenQContract = require('../__mocks__/MockOpenQContract');

			// ACT/ASSERT
			await expect(checkWithdrawalEligibility(issueUrl, oauthToken, pat, MockOpenQContract, payoutAddress)).rejects.toEqual(RATE_LIMITED_PAT({ issueUrl }));
		});

		it.only('should reject with RATE_LIMITED error if resultViewer is RATE_LIMITED', async () => {
			// ARRANGE
			const data = { foo: "hi" };
			const resultViewerError = { errors: [{ type: 'RATE_LIMITED' }] };
			mock.onPost('https://api.github.com/graphql').replyOnce(200, data);
			mock.onPost('https://api.github.com/graphql').replyOnce(200, resultViewerError);
			const MockOpenQContract = require('../__mocks__/MockOpenQContract');

			// ACT/ASSERT
			await expect(checkWithdrawalEligibility(issueUrl, oauthToken, pat, MockOpenQContract, payoutAddress)).rejects.toEqual(RATE_LIMITED({ issueUrl }));
		});

		it('should reject with GITHUB_OAUTH_TOKEN_LACKS_PRIVILEGES error if GitHub returns a 401', async () => {
			// ARRANGE
			mock.onPost('https://api.github.com/graphql').reply(401);

			const MockOpenQContract = require('../__mocks__/MockOpenQContract');

			// ACT/ASSERT
			await expect(checkWithdrawalEligibility(issueUrl, oauthToken, pat, MockOpenQContract, payoutAddress)).rejects.toEqual(GITHUB_OAUTH_TOKEN_LACKS_PRIVILEGES({ issueUrl }));
		});
	});

	describe('Correctly verifies withdrawal eligibility', () => {
		describe('Ineligible Responses', () => {
			it('should resolve with NO_PULL_REQUESTS_REFERENCE_ISSUE if none reference the issue', async () => {
				// ARRANGE
				const issuePrData = { data: { resource: { id: 'I_kwDOGWnnz85GZu4Y', number: 123, repository: { owner: { login: 'OpenQDev' } }, timelineItems: { edges: [] } } } };

				mock
					.onPost('https://api.github.com/graphql')
					.replyOnce(200, issuePrData)
					.onPost('https://api.github.com/graphql')
					.replyOnce(200, viewerData);

				const MockOpenQContract = require('../__mocks__/MockOpenQContract');

				// ACT/ASSERT
				await expect(checkWithdrawalEligibility(issueUrl, oauthToken, pat, MockOpenQContract, payoutAddress)).rejects.toEqual({ canWithdraw: false, errorMessage: 'No pull requests reference this issue.', issueId: 'I_kwDOGWnnz85GZu4Y', type: 'NO_PULL_REQUESTS_REFERENCE_ISSUE' });
			});

			it('should resolve with NO_WITHDRAWABLE_PR_FOUND if Pull Request references but is NOT MERGED', async () => {
				// ARRANGE
				const issuePrData = { data: { resource: { id: 'I_kwDOGWnnz85GkCSK', number: 139, repository: { owner: { login: 'OpenQDev' } }, timelineItems: { edges: [{ node: { createdAt: '2022-03-28T19:07:48Z', source: { __typename: 'PullRequest', bodyText: 'Closes #139', mergedAt: null, createdAt: '2022-03-28T19:07:48Z', userContentEdits: { edges: [] }, comments: { edges: [] }, merged: false, url: 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/140', author: { login: 'FlacoJones' }, baseRepository: { name: 'OpenQ-TestRepo', owner: { login: 'OpenQDev' } } } } }] } } } };

				mock
					.onPost('https://api.github.com/graphql')
					.replyOnce(200, issuePrData)
					.onPost('https://api.github.com/graphql')
					.replyOnce(200, viewerData);

				const MockOpenQContract = require('../__mocks__/MockOpenQContract');

				// ACT/ASSERT
				await expect(checkWithdrawalEligibility(issueUrl, oauthToken, pat, MockOpenQContract, payoutAddress)).rejects.toEqual({ canWithdraw: false, errorMessage: 'No withdrawable PR found.  In order for a pull request to unlock a claim, it must mention the associated bountied issue, be authored by you and merged by a maintainer. We found the following linked pull requests that do not meet the above criteria: https://github.com/OpenQDev/OpenQ-TestRepo/pull/140', issueId: 'I_kwDOGWnnz85GkCSK', type: 'NO_WITHDRAWABLE_PR_FOUND' });
			});

			it('should resolve with NO_WITHDRAWABLE_PR_FOUND if Pull Request is referenced and merged, but NOT AUTHORED BY VIEWER', async () => {
				// ARRANGE
				const issuePrData = { data: { resource: { id: 'I_kwDOGWnnz85GkCSK', number: 139, repository: { owner: { login: 'OpenQDev' } }, timelineItems: { edges: [{ node: { createdAt: '2022-03-28T19:07:48Z', source: { __typename: 'PullRequest', bodyText: 'Closes #139', mergedAt: null, createdAt: '2022-03-28T19:07:48Z', userContentEdits: { edges: [] }, comments: { edges: [] }, merged: true, url: 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/140', author: { login: 'NotFlacoJones' }, baseRepository: { name: 'OpenQ-TestRepo', owner: { login: 'OpenQDev' } } } } }] } } } };

				mock
					.onPost('https://api.github.com/graphql')
					.replyOnce(200, issuePrData)
					.onPost('https://api.github.com/graphql')
					.replyOnce(200, viewerData);

				const MockOpenQContract = require('../__mocks__/MockOpenQContract');

				// ACT/ASSERT
				await expect(checkWithdrawalEligibility(issueUrl, oauthToken, pat, MockOpenQContract, payoutAddress)).rejects.toEqual({ canWithdraw: false, errorMessage: 'No withdrawable PR found.  In order for a pull request to unlock a claim, it must mention the associated bountied issue, be authored by you and merged by a maintainer. We found the following linked pull requests that do not meet the above criteria: https://github.com/OpenQDev/OpenQ-TestRepo/pull/140', issueId: 'I_kwDOGWnnz85GkCSK', type: 'NO_WITHDRAWABLE_PR_FOUND' });
			});

			it('should resolve with NO_WITHDRAWABLE_PR_FOUND if Pull Request is referenced and merged, but CLOSER COMMENT NOT PRESENT AT MERGE TIME', async () => {
				const issuePrData = { data: { resource: { id: 'I_kwDOGWnnz85GkCSK', number: 139, repository: { owner: { login: 'OpenQDev' } }, timelineItems: { edges: [{ node: { createdAt: '2022-03-28T19:07:48Z', source: { __typename: 'PullRequest', bodyText: 'Closes #139', mergedAt: null, createdAt: '2022-03-28T19:07:48Z', userContentEdits: { edges: [] }, comments: { edges: [] }, merged: true, url: 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/140', author: { login: 'NotFlacoJones' }, baseRepository: { name: 'OpenQ-TestRepo', owner: { login: 'OpenQDev' } } } } }] } } } };

				mock
					.onPost('https://api.github.com/graphql')
					.replyOnce(200, issuePrData)
					.onPost('https://api.github.com/graphql')
					.replyOnce(200, viewerData);

				const MockOpenQContract = require('../__mocks__/MockOpenQContract');

				await expect(checkWithdrawalEligibility(issueUrl, oauthToken, pat, MockOpenQContract, payoutAddress)).rejects.toEqual({ canWithdraw: false, errorMessage: 'No withdrawable PR found.  In order for a pull request to unlock a claim, it must mention the associated bountied issue, be authored by you and merged by a maintainer. We found the following linked pull requests that do not meet the above criteria: https://github.com/OpenQDev/OpenQ-TestRepo/pull/140', issueId: 'I_kwDOGWnnz85GkCSK', type: 'NO_WITHDRAWABLE_PR_FOUND' });
			});
		});

		describe('Eligible Response', () => {
			it('should resolve to with canWithdraw: true if eligible pull request is connected in BODY', async () => {
				// ARRANGE
				const issuePrData = { data: { viewer: { login: 'FlacoJones' }, resource: { id: 'I_kwDOGWnnz85GjwA1', number: 136, repository: { owner: { login: 'OpenQDev' } }, timelineItems: { edges: [{ node: { createdAt: '2022-03-28T17:47:26Z', source: { __typename: 'PullRequest', bodyText: 'This Closes #136 and also unrelated thing of Fixes #137', mergedAt: '2022-03-28T17:57:44Z', createdAt: '2022-03-28T17:47:26Z', userContentEdits: { edges: [] }, comments: { edges: [] }, merged: true, url: 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/138', author: { login: 'FlacoJones' }, baseRepository: { name: 'OpenQ-TestRepo', owner: { login: 'OpenQDev' } } } } }] } } } };

				mock
					.onPost('https://api.github.com/graphql')
					.replyOnce(200, issuePrData)
					.onPost('https://api.github.com/graphql')
					.replyOnce(200, viewerData);

				const MockOpenQContract = require('../__mocks__/MockOpenQContract');
				MockOpenQContract.bountyTypeReturn = 0;

				// ACT/ASSERT
				await expect(checkWithdrawalEligibility(issueUrl, oauthToken, pat, MockOpenQContract, payoutAddress)).resolves.toEqual({ 'canWithdraw': true, type: 'SUCCESS', claimantAsset: 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/138', claimant: 'FlacoJones', issueId: 'I_kwDOGWnnz85GjwA1', errorMessage: null, tier: null });
			});

			it('should resolve to with canWithdraw: true if eligible pull request is connected in COMMENTS', async () => {
				// ARRANGE
				const issuePrData = { data: { viewer: { login: 'FlacoJones' }, resource: { id: 'I_kwDOGWnnz85GjwA1', number: 136, repository: { owner: { login: 'OpenQDev' } }, timelineItems: { edges: [{ node: { createdAt: '2022-03-28T17:47:26Z', source: { __typename: 'PullRequest', bodyText: 'This Closes #136 and also unrelated thing of Fixes #137', mergedAt: '2022-03-28T17:57:44Z', createdAt: '2022-03-28T17:47:26Z', userContentEdits: { edges: [] }, comments: { edges: [] }, merged: true, url: 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/138', author: { login: 'FlacoJones' }, baseRepository: { name: 'OpenQ-TestRepo', owner: { login: 'OpenQDev' } } } } }] } } } };

				mock
					.onPost('https://api.github.com/graphql')
					.replyOnce(200, issuePrData)
					.onPost('https://api.github.com/graphql')
					.replyOnce(200, viewerData);

				const MockOpenQContract = require('../__mocks__/MockOpenQContract');
				MockOpenQContract.bountyTypeReturn = 0;

				// ACT/ASSERT
				await expect(checkWithdrawalEligibility(issueUrl, oauthToken, pat, MockOpenQContract, payoutAddress)).resolves.toEqual({ 'canWithdraw': true, type: 'SUCCESS', claimantAsset: 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/138', claimant: 'FlacoJones', issueId: 'I_kwDOGWnnz85GjwA1', errorMessage: null, tier: null });
			});

			describe('ONGOING', () => {
				it('should resolve to with canWithdraw: true for ongoing with multiple claims - first claimed, second unclaimed', async () => {
					// ARRANGE
					const issuePrData = {
						data: {
							viewer: { login: 'FlacoJones' }, resource: {
								id: 'I_kwDOGWnnz85GjwA1', number: 136, repository: { owner: { login: 'OpenQDev' } }, timelineItems: {
									edges: [
										{ node: { createdAt: '2022-03-28T17:47:26Z', source: { __typename: 'PullRequest', bodyText: 'This Closes #136 and also unrelated thing of Fixes #137', mergedAt: '2022-03-28T17:57:44Z', createdAt: '2022-03-28T17:47:26Z', userContentEdits: { edges: [] }, comments: { edges: [] }, merged: true, url: 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/138', author: { login: 'FlacoJones' }, baseRepository: { name: 'OpenQ-TestRepo', owner: { login: 'OpenQDev' } } } } },
										{ node: { createdAt: '2022-03-28T17:47:26Z', source: { __typename: 'PullRequest', bodyText: 'This Closes #136 and also unrelated thing of Fixes #137', mergedAt: '2022-03-28T17:57:44Z', createdAt: '2022-03-28T17:47:26Z', userContentEdits: { edges: [] }, comments: { edges: [] }, merged: true, url: 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/139', author: { login: 'FlacoJones' }, baseRepository: { name: 'OpenQ-TestRepo', owner: { login: 'OpenQDev' } } } } }
									]
								}
							}
						}
					};

					mock
						.onPost('https://api.github.com/graphql')
						.replyOnce(200, issuePrData)
						.onPost('https://api.github.com/graphql')
						.replyOnce(200, viewerData);

					const MockOpenQContract = require('../__mocks__/MockOpenQContract');
					MockOpenQContract.ongoingClaimedMap = { 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/138': true };
					MockOpenQContract.bountyTypeReturn = 1;

					// ACT/ASSERT
					await expect(checkWithdrawalEligibility(issueUrl, oauthToken, pat, MockOpenQContract, payoutAddress)).resolves.toEqual({ 'canWithdraw': true, type: 'SUCCESS', claimantAsset: 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/139', claimant: 'FlacoJones', issueId: 'I_kwDOGWnnz85GjwA1', errorMessage: null, tier: null });
				});
			});

			describe('TIERED', () => {
				it('should resolve to with canWithdraw: true for tiered with multiple claims - first claimed, second unclaimed', async () => {
					// ARRANGE
					const issuePrData = {
						data: {
							viewer: { login: 'FlacoJones' }, resource: {
								id: 'I_kwDOGWnnz85GjwA1', number: 136, repository: { owner: { login: 'OpenQDev' } }, timelineItems: {
									edges: [
										{ node: { createdAt: '2022-03-28T17:47:26Z', source: { __typename: 'PullRequest', bodyText: 'This Closes #136 and is OpenQ-Tier-1-Winner', mergedAt: '2022-03-28T17:57:44Z', createdAt: '2022-03-28T17:47:26Z', userContentEdits: { edges: [] }, comments: { edges: [] }, merged: true, url: 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/138', author: { login: 'FlacoJones' }, baseRepository: { name: 'OpenQ-TestRepo', owner: { login: 'OpenQDev' } } } } },
										{ node: { createdAt: '2022-03-28T17:47:26Z', source: { __typename: 'PullRequest', bodyText: 'This Closes #136 and is OpenQ-Tier-2-Winner', mergedAt: '2022-03-28T17:57:44Z', createdAt: '2022-03-28T17:47:26Z', userContentEdits: { edges: [] }, comments: { edges: [] }, merged: true, url: 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/139', author: { login: 'FlacoJones' }, baseRepository: { name: 'OpenQ-TestRepo', owner: { login: 'OpenQDev' } } } } }
									]
								}
							}
						}
					};

					mock
						.onPost('https://api.github.com/graphql')
						.replyOnce(200, issuePrData)
						.onPost('https://api.github.com/graphql')
						.replyOnce(200, viewerData);

					const MockOpenQContract = require('../__mocks__/MockOpenQContract');
					MockOpenQContract.bountyTypeReturn = 2;
					MockOpenQContract.tierClaimedReturn = false;

					// ACT/ASSERT
					await expect(checkWithdrawalEligibility(issueUrl, oauthToken, pat, MockOpenQContract, payoutAddress)).resolves.toEqual({ 'canWithdraw': true, type: 'SUCCESS', claimantAsset: 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/139', claimant: 'FlacoJones', issueId: 'I_kwDOGWnnz85GjwA1', errorMessage: null, tier: 1 });
				});
			});
		});
	});
});
