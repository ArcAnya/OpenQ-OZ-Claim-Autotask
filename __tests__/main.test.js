const dotenv = require('dotenv');
const _ = require('lodash');
const main = require('../main');
dotenv.config();

/* 
INTEGRATION TEST

This is an integration test which makes live calls to the GitHub GraphQL API.

As such, before testing you must provide a valid GitHub OAuth token signed by COOKIE_SIGNER in .env before running.
*/
describe('main', () => {
	let event;
	let payoutAddress = '0x1abc0D6fb0d5A374027ce98Bf15716A3Ee31e580';
	let apiKey = 'mockApiKey';
	let apiSecret = 'mockApiSecret';

	// Test Issues

	// BODY REFERENCES
	const issueReferencedAndMergedByFlacoJones = 'https://github.com/OpenQDev/OpenQ-TestRepo/issues/136';
	const bodyPreMergeEdits = 'https://github.com/OpenQDev/OpenQ-TestRepo/issues/180';
	const bodyPostMergeEdits = 'https://github.com/OpenQDev/OpenQ-TestRepo/issues/182';

	// COMMENT REFERENCES
	const commentNoEdits = 'https://github.com/OpenQDev/OpenQ-TestRepo/issues/186';
	const commentPreMergeEdits = 'https://github.com/OpenQDev/OpenQ-TestRepo/issues/188';
	const commentPostMergeEdits = 'https://github.com/OpenQDev/OpenQ-TestRepo/issues/184';

	// NO PULL REQUEST REFERNECES
	const noPullRequestReferences = 'https://github.com/OpenQDev/OpenQ-TestRepo/issues/179';

	// MULTIPLE REQUEST REFERNECES
	const multiplePullRequestReferences = 'https://github.com/OpenQDev/OpenQ-TestRepo/issues/190';

	// 'RELATED TO' REQUEST REFERNECES
	const relatedToPullRequestReference = 'https://github.com/OpenQDev/OpenQ-TestRepo/issues/197';

	// NOT MERGED
	const referencedButNotMerged = 'https://github.com/OpenQDev/OpenQ-TestRepo/issues/139';

	beforeEach(() => {
		event = {
			request: {
				body: {
					issueUrl: issueReferencedAndMergedByFlacoJones,
					payoutAddress
				},
				headers: {
					'x-authorization': process.env.SIGNED_OAUTH_TOKEN
				}
			},
			secrets: {
				COOKIE_SIGNER: process.env.COOKIE_SIGNER,
				OPENQ_PROXY_ADDRESS: process.env.OPENQ_PROXY_ADDRESS
			},
			apiKey,
			apiSecret,
		};
	});

	describe('NOT MERGED', () => {
		it('should reject if pull request is not merged', async () => {
			const obj = { request: { body: { issueUrl: referencedButNotMerged } } };
			event = _.merge(event, obj);

			const MockOpenQContract = require('../__mocks__/MockOpenQContract');
			MockOpenQContract.isOpen = true;

			await expect(main(event, MockOpenQContract)).rejects.toEqual({ canWithdraw: false, issueId: 'I_kwDOGWnnz85GkCSK', type: 'NO_WITHDRAWABLE_PR_FOUND', errorMessage: 'No withdrawable PR found.  In order for a pull request to unlock a claim, it must mention the associated bountied issue, be authored by you and merged by a maintainer. We found the following linked pull requests that do not meet the above criteria: https://github.com/OpenQDev/OpenQ-TestRepo/pull/140' });
		});
	});

	describe('PULL REQUEST BODY', () => {
		it('should resolve with issueId and txnHash for properly referenced issue - pull request body, no edits', async () => {
			const obj = { request: { body: { issueUrl: issueReferencedAndMergedByFlacoJones } } };
			event = _.merge(event, obj);

			const MockOpenQContract = require('../__mocks__/MockOpenQContract');
			MockOpenQContract.isOpen = true;

			await expect(main(event, MockOpenQContract)).resolves.toEqual({ issueId: 'I_kwDOGWnnz85GjwA1', txnHash: '0x123abc' });
		});

		it('should resolve with issueId and txnHash for properly referenced issue - pull request body, pre-merge edits', async () => {
			const obj = { request: { body: { issueUrl: bodyPreMergeEdits } } };
			event = _.merge(event, obj);

			const MockOpenQContract = require('../__mocks__/MockOpenQContract');
			MockOpenQContract.isOpen = true;

			await expect(main(event, MockOpenQContract)).resolves.toEqual({ issueId: 'I_kwDOGWnnz85IbulA', txnHash: '0x123abc' });
		});

		it('should reject with  NO_WITHDRAWABLE_PR_FOUND for post-merge body references - pull request body, post-merge edits', async () => {
			const obj = { request: { body: { issueUrl: bodyPostMergeEdits } } };
			event = _.merge(event, obj);

			const MockOpenQContract = require('../__mocks__/MockOpenQContract');
			MockOpenQContract.isOpen = true;

			await expect(main(event, MockOpenQContract)).rejects.toEqual({ canWithdraw: false, errorMessage: 'No withdrawable PR found.  In order for a pull request to unlock a claim, it must mention the associated bountied issue, be authored by you and merged by a maintainer. We found the following linked pull requests that do not meet the above criteria: https://github.com/OpenQDev/OpenQ-TestRepo/pull/183', issueId: 'I_kwDOGWnnz85IbvFe', type: 'NO_WITHDRAWABLE_PR_FOUND' });
		});
	});

	describe('COMMENTS', () => {
		it('should reject with  NO_WITHDRAWABLE_PR_FOUND for post-merge body references - pull request commentPostMergeEdits, post-merge edits', async () => {
			const obj = { request: { body: { issueUrl: commentPostMergeEdits } } };
			event = _.merge(event, obj);

			const MockOpenQContract = require('../__mocks__/MockOpenQContract');
			MockOpenQContract.isOpen = true;

			await expect(main(event, MockOpenQContract)).rejects.toEqual({ canWithdraw: false, errorMessage: 'No withdrawable PR found.  In order for a pull request to unlock a claim, it must mention the associated bountied issue, be authored by you and merged by a maintainer. We found the following linked pull requests that do not meet the above criteria: https://github.com/OpenQDev/OpenQ-TestRepo/pull/185', issueId: 'I_kwDOGWnnz85Ibvoq', type: 'NO_WITHDRAWABLE_PR_FOUND' });
		});

		it('should resolve with issueId and txnHash for properly referenced issue - pull request comment, no edits', async () => {
			const obj = { request: { body: { issueUrl: commentNoEdits } } };
			event = _.merge(event, obj);

			const MockOpenQContract = require('../__mocks__/MockOpenQContract');
			MockOpenQContract.isOpen = true;

			await expect(main(event, MockOpenQContract)).resolves.toEqual({ issueId: 'I_kwDOGWnnz85IbwJy', txnHash: '0x123abc' });
		});

		it('should resolve with issueId and txnHash for properly referenced issue - pull request comment, pre-merge edits', async () => {
			const obj = { request: { body: { issueUrl: commentPreMergeEdits } } };
			event = _.merge(event, obj);

			const MockOpenQContract = require('../__mocks__/MockOpenQContract');
			MockOpenQContract.isOpen = true;

			await expect(main(event, MockOpenQContract)).resolves.toEqual({ issueId: 'I_kwDOGWnnz85Ibw9J', txnHash: '0x123abc' });
		});
	});

	describe('MULTIPLE or NO or NON-CLOSER REFERENCES', () => {
		it('should reject with NO_PULL_REQUESTS_REFERENCE_ISSUE if no pull request references the issue', async () => {
			const obj = { request: { body: { issueUrl: noPullRequestReferences } } };
			event = _.merge(event, obj);

			const MockOpenQContract = require('../__mocks__/MockOpenQContract');
			MockOpenQContract.isOpen = true;

			await expect(main(event, MockOpenQContract)).rejects.toEqual({ canWithdraw: false, errorMessage: 'No pull requests reference this issue.', issueId: 'I_kwDOGWnnz85Iaa3I', type: 'NO_PULL_REQUESTS_REFERENCE_ISSUE' });
		});

		it('should reject with NO_PULL_REQUESTS_REFERENCE_ISSUE if a pull request references this issue using non-closer keywords', async () => {
			const obj = { request: { body: { issueUrl: relatedToPullRequestReference } } };
			event = _.merge(event, obj);

			const MockOpenQContract = require('../__mocks__/MockOpenQContract');
			MockOpenQContract.isOpen = true;

			await expect(main(event, MockOpenQContract)).rejects.toEqual({ canWithdraw: false, errorMessage: 'No withdrawable PR found.  In order for a pull request to unlock a claim, it must mention the associated bountied issue, be authored by you and merged by a maintainer. We found the following linked pull requests that do not meet the above criteria: https://github.com/OpenQDev/OpenQ-TestRepo/pull/198', issueId: 'I_kwDOGWnnz85Ibz0R', type: 'NO_WITHDRAWABLE_PR_FOUND' });
		});

		it('should resolve with issueId and txnHash for properly referenced issue - multiple pull request references, second one valid', async () => {
			const obj = { request: { body: { issueUrl: multiplePullRequestReferences } } };
			event = _.merge(event, obj);

			const MockOpenQContract = require('../__mocks__/MockOpenQContract');
			MockOpenQContract.isOpen = true;

			await expect(main(event, MockOpenQContract)).resolves.toEqual({ issueId: 'I_kwDOGWnnz85Ibxky', txnHash: '0x123abc' });
		});
	});
});