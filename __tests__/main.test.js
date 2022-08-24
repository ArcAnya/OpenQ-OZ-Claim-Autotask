const dotenv = require('dotenv');
const ethers = require('ethers');
const _ = require('lodash');
const main = require('../main');
const MockClaimManager = require('../__mocks__/MockClaimManager');
const MockOpenQContract = require('../__mocks__/MockOpenQContract');
dotenv.config();

/* 
INTEGRATION TEST

This is an integration test which makes live calls to the GitHub GraphQL API.

As such, before testing you must provide a valid GitHub OAuth token signed by COOKIE_SIGNER in .env before running.

To do so, start a Node console and run:

const cookie = require('cookie-signature');
cookie.sign('<your gho token>', '<your COOKIE_SIGNER>')

for example:
cookie.sign('gho_vshjeyuyuy34', 'entropy123')
*/
describe('main', () => {
	let event;
	let payoutAddress = '0x1abc0D6fb0d5A374027ce98Bf15716A3Ee31e580';
	let apiKey = 'mockApiKey';
	let apiSecret = 'mockApiSecret';
	const abiCoder = new ethers.utils.AbiCoder;

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

	// TIERED
	const referencedTier1Winner = 'https://github.com/OpenQDev/OpenQ-TestRepo/issues/449';

	// ONGOING
	const ongoing = 'https://github.com/OpenQDev/OpenQ-TestRepo/issues/451';

	// ALTERNATIVE ISSUE REFERNECE
	const closerWithOddCharacters = 'https://github.com/OpenQDev/OpenQ-TestRepo/issues/517';
	const closerWithFullIssueUrl = 'https://github.com/OpenQDev/OpenQ-TestRepo/issues/519';

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
				OPENQ_PROXY_ADDRESS: process.env.OPENQ_PROXY_ADDRESS,
				PAT: process.env.PAT
			},
			apiKey,
			apiSecret,
		};

		MockOpenQContract.reset();
	});

	describe('INELEGIBLE', () => {
		describe('GITHUB RELATED INELIGIBILITY', () => {
			describe('NOT MERGED', () => {
				it('should reject if pull request is not merged', async () => {
					const obj = { request: { body: { issueUrl: referencedButNotMerged } } };
					event = _.merge(event, obj);

					MockOpenQContract.isOpen = true;
					MockOpenQContract.bountyTypeReturn = {};

					await expect(main(event, MockOpenQContract, MockClaimManager)).rejects.toEqual({ canWithdraw: false, issueId: 'I_kwDOGWnnz85GkCSK', type: 'NO_WITHDRAWABLE_PR_FOUND', errorMessage: 'No withdrawable PR found.  In order for a pull request to unlock a claim, it must mention the associated bountied issue, be authored by you and merged by a maintainer. We found the following linked pull requests that do not meet the above criteria: https://github.com/OpenQDev/OpenQ-TestRepo/pull/140' });
				});
			});

			describe('PULL REQUEST BODY', () => {
				it('should reject with  NO_WITHDRAWABLE_PR_FOUND for post-merge body references - pull request body, post-merge edits', async () => {
					const obj = { request: { body: { issueUrl: bodyPostMergeEdits } } };
					event = _.merge(event, obj);

					await expect(main(event, MockOpenQContract, MockClaimManager)).rejects.toEqual({ canWithdraw: false, errorMessage: 'No withdrawable PR found.  In order for a pull request to unlock a claim, it must mention the associated bountied issue, be authored by you and merged by a maintainer. We found the following linked pull requests that do not meet the above criteria: https://github.com/OpenQDev/OpenQ-TestRepo/pull/183', issueId: 'I_kwDOGWnnz85IbvFe', type: 'NO_WITHDRAWABLE_PR_FOUND' });
				});
			});

			describe('COMMENTS', () => {
				it('should reject with  NO_WITHDRAWABLE_PR_FOUND for post-merge body references - pull request commentPostMergeEdits, post-merge edits', async () => {
					const obj = { request: { body: { issueUrl: commentPostMergeEdits } } };
					event = _.merge(event, obj);

					MockOpenQContract.isOpen = true;

					await expect(main(event, MockOpenQContract, MockClaimManager)).rejects.toEqual({ canWithdraw: false, errorMessage: 'No withdrawable PR found.  In order for a pull request to unlock a claim, it must mention the associated bountied issue, be authored by you and merged by a maintainer. We found the following linked pull requests that do not meet the above criteria: https://github.com/OpenQDev/OpenQ-TestRepo/pull/185', issueId: 'I_kwDOGWnnz85Ibvoq', type: 'NO_WITHDRAWABLE_PR_FOUND' });
				});
			});

			describe('MULTIPLE or NO or NON-CLOSER REFERENCES', () => {
				it('should reject with NO_PULL_REQUESTS_REFERENCE_ISSUE if no pull request references the issue', async () => {
					const obj = { request: { body: { issueUrl: noPullRequestReferences } } };
					event = _.merge(event, obj);


					MockOpenQContract.isOpen = true;

					await expect(main(event, MockOpenQContract, MockClaimManager)).rejects.toEqual({ canWithdraw: false, errorMessage: 'No pull requests reference this issue.', issueId: 'I_kwDOGWnnz85Iaa3I', type: 'NO_PULL_REQUESTS_REFERENCE_ISSUE' });
				});

				it('should reject with NO_PULL_REQUESTS_REFERENCE_ISSUE if a pull request references this issue using non-closer keywords', async () => {
					const obj = { request: { body: { issueUrl: relatedToPullRequestReference } } };
					event = _.merge(event, obj);


					MockOpenQContract.isOpen = true;

					await expect(main(event, MockOpenQContract, MockClaimManager)).rejects.toEqual({ canWithdraw: false, errorMessage: 'No withdrawable PR found.  In order for a pull request to unlock a claim, it must mention the associated bountied issue, be authored by you and merged by a maintainer. We found the following linked pull requests that do not meet the above criteria: https://github.com/OpenQDev/OpenQ-TestRepo/pull/198', issueId: 'I_kwDOGWnnz85Ibz0R', type: 'NO_WITHDRAWABLE_PR_FOUND' });
				});
			});
		});

		describe('OPENQ RELATED INELIGIBILITY', () => {
			describe('SINGLE', () => {
				it('should reject if bounty is closed', async () => {


					MockOpenQContract.isOpen = false;
					MockOpenQContract.bountyTypeReturn = 0;
					const bountyAddress = '0x46e09468616365256F11F4544e65cE0C70ee624b';
					MockOpenQContract.bountyIdToAddressReturn = bountyAddress;

					await expect(main(event, MockOpenQContract, MockClaimManager)).rejects.toEqual({ type: 'BOUNTY_IS_CLAIMED', id: '0x1abc0D6fb0d5A374027ce98Bf15716A3Ee31e580', errorMessage: 'Bounty for https://github.com/OpenQDev/OpenQ-TestRepo/issues/136 is already claimed', canWithdraw: false });
				});
			});

			describe('ONGOING', () => {
				it('should fail if claimant id is claimed - Ongoing', async () => {
					const obj = { request: { body: { issueUrl: ongoing } } };
					event = _.merge(event, obj);

					const linkedPullRequest = 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/452';

					MockOpenQContract.isOpen = true;
					MockOpenQContract.ongoingClaimedMap = { [linkedPullRequest]: true };
					MockOpenQContract.bountyTypeReturn = 1;
					const bountyAddress = '0x46e09468616365256F11F4544e65cE0C70ee624b';
					MockOpenQContract.bountyIdToAddressReturn = bountyAddress;

					await expect(main(event, MockOpenQContract, MockClaimManager)).rejects.toEqual({ canWithdraw: false, errorMessage: 'Ongoing Bounty for https://github.com/OpenQDev/OpenQ-TestRepo/issues/451 has already been claimed by FlacoJones for https://github.com/OpenQDev/OpenQ-TestRepo/pull/452.', id: '0x1abc0D6fb0d5A374027ce98Bf15716A3Ee31e580', type: 'BOUNTY_IS_CLAIMED' });
				});

				it('should fail if ongoing contract is insolvent', async () => {
					const obj = { request: { body: { issueUrl: ongoing } } };
					event = _.merge(event, obj);

					const linkedPullRequest = 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/452';

					MockOpenQContract.isOpen = true;
					MockOpenQContract.ongoingClaimedMap = { [linkedPullRequest]: false };
					MockOpenQContract.bountyTypeReturn = 1;
					const bountyAddress = '0x46e09468616365256F11F4544e65cE0C70ee624b';
					MockOpenQContract.bountyIdToAddressReturn = bountyAddress;
					MockOpenQContract.isSolvent = false;

					await expect(main(event, MockOpenQContract, MockClaimManager)).rejects.toEqual({ canWithdraw: false, errorMessage: 'Ongoing Bounty for https://github.com/OpenQDev/OpenQ-TestRepo/issues/451 has insufficient funds to payout this eligible withdrawl. Please contact the organization maintainer.', id: '0x1abc0D6fb0d5A374027ce98Bf15716A3Ee31e580', type: 'BOUNTY_IS_INSOLVENT' });
				});
			});

			describe('TIERED', () => {
				it('should reject if tier is already claimed - TIER 0/FIRST PLACE', async () => {
					const obj = { request: { body: { issueUrl: referencedTier1Winner } } };
					event = _.merge(event, obj);

					MockOpenQContract.isOpen = true;
					MockOpenQContract.bountyTypeReturn = 2;
					MockOpenQContract.tierClaimedReturn = true;
					const bountyAddress = '0x46e09468616365256F11F4544e65cE0C70ee624b';
					MockOpenQContract.bountyIdToAddressReturn = bountyAddress;

					await expect(main(event, MockOpenQContract, MockClaimManager)).rejects.toEqual({ type: 'NO_WITHDRAWABLE_PR_FOUND', issueId: 'I_kwDOGWnnz85Oi4wi', errorMessage: 'No withdrawable PR found.  In order for a pull request to unlock a claim, it must mention the associated bountied issue, be authored by you and merged by a maintainer. We found the following linked pull requests that do not meet the above criteria: https://github.com/OpenQDev/OpenQ-TestRepo/pull/450', canWithdraw: false });
				});
			});
		});
	});

	describe('ELIGIBLE', () => {
		describe('PULL REQUEST BODY', () => {
			it('should resolve with issueId and txnHash for properly referenced issue - pull request body, no edits', async () => {
				const obj = { request: { body: { issueUrl: issueReferencedAndMergedByFlacoJones } } };
				event = _.merge(event, obj);

				const MockClaimManager = require('../__mocks__/MockClaimManager');
				const MockOpenQContract = require('../__mocks__/MockOpenQContract');
				MockOpenQContract.isOpen = true;
				MockOpenQContract.bountyTypeReturn = 0;
				const bountyAddress = '0x46e09468616365256F11F4544e65cE0C70ee624b';
				MockOpenQContract.bountyIdToAddressReturn = bountyAddress;

				const closerData = abiCoder.encode(['address', 'string', 'address', 'string'], ['0x46e09468616365256F11F4544e65cE0C70ee624b', 'FlacoJones', payoutAddress, 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/138']);

				await expect(main(event, MockOpenQContract, MockClaimManager)).resolves.toEqual({ issueId: 'I_kwDOGWnnz85GjwA1', closerData, txnHash: '0x123abc' });
			});

			it('should resolve with issueId and txnHash for properly referenced issue - TIER 0/FIRST PLACE', async () => {
				const obj = { request: { body: { issueUrl: referencedTier1Winner } } };
				event = _.merge(event, obj);

				const MockClaimManager = require('../__mocks__/MockClaimManager');
				const MockOpenQContract = require('../__mocks__/MockOpenQContract');
				// for competition, should be closed in order to claim
				MockOpenQContract.isOpen = false;
				MockOpenQContract.bountyTypeReturn = 2;
				MockOpenQContract.tierClaimedReturn = false;
				const bountyAddress = '0x46e09468616365256F11F4544e65cE0C70ee624b';
				MockOpenQContract.bountyIdToAddressReturn = bountyAddress;

				const closerData = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [bountyAddress, 'FlacoJones', payoutAddress, 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/450', 0]);

				await expect(main(event, MockOpenQContract, MockClaimManager)).resolves.toEqual({ issueId: 'I_kwDOGWnnz85Oi4wi', closerData, txnHash: '0x123abc' });
			});

			it('should resolve with issueId and txnHash for properly referenced issue - Ongoing', async () => {
				const obj = { request: { body: { issueUrl: ongoing } } };
				event = _.merge(event, obj);

				const MockClaimManager = require('../__mocks__/MockClaimManager');
				const MockOpenQContract = require('../__mocks__/MockOpenQContract');
				MockOpenQContract.isOpen = true;
				MockOpenQContract.bountyTypeReturn = 1;
				MockOpenQContract.ongoingClaimedMap = { 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/452': false };
				const bountyAddress = '0x46e09468616365256F11F4544e65cE0C70ee624b';
				MockOpenQContract.bountyIdToAddressReturn = bountyAddress;
				MockOpenQContract.isSolvent = true;

				const closerData = abiCoder.encode(['address', 'string', 'address', 'string'], ['0x46e09468616365256F11F4544e65cE0C70ee624b', 'FlacoJones', payoutAddress, 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/452']);

				await expect(main(event, MockOpenQContract, MockClaimManager)).resolves.toEqual({ issueId: 'I_kwDOGWnnz85Oi-oQ', closerData, txnHash: '0x123abc' });
			});

			it('should resolve with issueId and txnHash for properly referenced issue - pull request body, no edits, with new line', async () => {
				const obj = { request: { body: { issueUrl: closerWithOddCharacters } } };
				event = _.merge(event, obj);

				const MockClaimManager = require('../__mocks__/MockClaimManager');
				const MockOpenQContract = require('../__mocks__/MockOpenQContract');
				MockOpenQContract.isOpen = true;
				MockOpenQContract.bountyTypeReturn = 0;
				const bountyAddress = '0x46e09468616365256F11F4544e65cE0C70ee624b';
				MockOpenQContract.bountyIdToAddressReturn = bountyAddress;

				const closerData = abiCoder.encode(['address', 'string', 'address', 'string'], ['0x46e09468616365256F11F4544e65cE0C70ee624b', 'FlacoJones', payoutAddress, 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/518']);

				await expect(main(event, MockOpenQContract, MockClaimManager)).resolves.toEqual({ issueId: 'I_kwDOGWnnz85QO9ai', closerData, txnHash: '0x123abc' });
			});

			it('should resolve with issueId and txnHash for properly referenced issue - pull request body, no edits, with URL reference', async () => {
				const obj = { request: { body: { issueUrl: closerWithFullIssueUrl } } };
				event = _.merge(event, obj);

				const MockClaimManager = require('../__mocks__/MockClaimManager');
				const MockOpenQContract = require('../__mocks__/MockOpenQContract');
				MockOpenQContract.isOpen = true;
				MockOpenQContract.bountyTypeReturn = 0;
				const bountyAddress = '0x46e09468616365256F11F4544e65cE0C70ee624b';
				MockOpenQContract.bountyIdToAddressReturn = bountyAddress;

				const closerData = abiCoder.encode(['address', 'string', 'address', 'string'], ['0x46e09468616365256F11F4544e65cE0C70ee624b', 'FlacoJones', payoutAddress, 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/520']);

				await expect(main(event, MockOpenQContract, MockClaimManager)).resolves.toEqual({ issueId: 'I_kwDOGWnnz85QO_Oe', closerData, txnHash: '0x123abc' });
			});

			it('should resolve with issueId and txnHash for properly referenced issue - pull request body, pre-merge edits', async () => {
				const obj = { request: { body: { issueUrl: bodyPreMergeEdits } } };
				event = _.merge(event, obj);

				const MockClaimManager = require('../__mocks__/MockClaimManager');
				const MockOpenQContract = require('../__mocks__/MockOpenQContract');
				MockOpenQContract.isOpen = true;
				MockOpenQContract.bountyTypeReturn = 0;

				const closerData = abiCoder.encode(['address', 'string', 'address', 'string'], ['0x46e09468616365256F11F4544e65cE0C70ee624b', 'FlacoJones', payoutAddress, 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/181']);

				await expect(main(event, MockOpenQContract, MockClaimManager)).resolves.toEqual({ issueId: 'I_kwDOGWnnz85IbulA', closerData, txnHash: '0x123abc' });
			});
		});

		describe('COMMENTS', () => {
			it('should resolve with issueId and txnHash for properly referenced issue - pull request comment, no edits', async () => {
				const obj = { request: { body: { issueUrl: commentNoEdits } } };
				event = _.merge(event, obj);

				const MockClaimManager = require('../__mocks__/MockClaimManager');
				const MockOpenQContract = require('../__mocks__/MockOpenQContract');
				MockOpenQContract.isOpen = true;
				MockOpenQContract.bountyTypeReturn = 0;

				const closerData = abiCoder.encode(['address', 'string', 'address', 'string'], ['0x46e09468616365256F11F4544e65cE0C70ee624b', 'FlacoJones', payoutAddress, 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/187']);

				await expect(main(event, MockOpenQContract, MockClaimManager)).resolves.toEqual({ issueId: 'I_kwDOGWnnz85IbwJy', closerData, txnHash: '0x123abc' });
			});

			it('should resolve with issueId and txnHash for properly referenced issue - pull request comment, pre-merge edits', async () => {
				const obj = { request: { body: { issueUrl: commentPreMergeEdits } } };
				event = _.merge(event, obj);

				const MockClaimManager = require('../__mocks__/MockClaimManager');
				const MockOpenQContract = require('../__mocks__/MockOpenQContract');
				MockOpenQContract.isOpen = true;
				MockOpenQContract.bountyTypeReturn = 0;

				const closerData = abiCoder.encode(['address', 'string', 'address', 'string'], ['0x46e09468616365256F11F4544e65cE0C70ee624b', 'FlacoJones', payoutAddress, 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/189']);

				await expect(main(event, MockOpenQContract, MockClaimManager)).resolves.toEqual({ issueId: 'I_kwDOGWnnz85Ibw9J', closerData, txnHash: '0x123abc' });
			});
		});

		describe('MULTIPLE or NO or NON-CLOSER REFERENCES', () => {
			it('should resolve with issueId and txnHash for properly referenced issue - multiple pull request references, second one valid', async () => {
				const obj = { request: { body: { issueUrl: multiplePullRequestReferences } } };
				event = _.merge(event, obj);

				const MockClaimManager = require('../__mocks__/MockClaimManager');
				const MockOpenQContract = require('../__mocks__/MockOpenQContract');
				MockOpenQContract.isOpen = true;
				MockOpenQContract.bountyTypeReturn = 0;
				const bountyAddress = '0x46e09468616365256F11F4544e65cE0C70ee624b';
				MockOpenQContract.bountyIdToAddressReturn = bountyAddress;

				const closerData = abiCoder.encode(['address', 'string', 'address', 'string'], ['0x46e09468616365256F11F4544e65cE0C70ee624b', 'FlacoJones', payoutAddress, 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/192']);

				await expect(main(event, MockOpenQContract, MockClaimManager)).resolves.toEqual({ issueId: 'I_kwDOGWnnz85Ibxky', closerData, txnHash: '0x123abc' });
			});
		});
	});
});