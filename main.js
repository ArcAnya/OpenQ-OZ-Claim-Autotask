const checkWithdrawalEligibilityImpl = require('./lib/checkWithdrawalEligibility');
const validateSignedOauthTokenImpl = require('./lib/validateSignedOauthToken');
const { BOUNTY_IS_CLAIMED } = require('./errors');
const ethers = require('ethers');

const main = async (
	event,
	contract,
	checkWithdrawalEligibility = checkWithdrawalEligibilityImpl,
	validateSignedOauthToken = validateSignedOauthTokenImpl
) => {
	return new Promise(async (resolve, reject) => {
		const { issueUrl, payoutAddress } = event.request.body;
		console.log(`Attempting claim on ${issueUrl} to ${payoutAddress}`);

		let oauthToken;
		try {
			oauthToken = await validateSignedOauthToken(payoutAddress, event);
		} catch (error) {
			return reject(error);
		}

		try {
			const { canWithdraw, issueId, claimantPullRequestUrl, tier } = await checkWithdrawalEligibility(issueUrl, oauthToken, event.secrets.PAT);

			const issueIsOpen = await contract.bountyIsOpen(issueId);
			const bountyClass = await contract.bountyClass(issueId);

			if (canWithdraw && issueIsOpen) {
				const options = { gasLimit: 3000000 };

				let closerData;
				const abiCoder = new ethers.utils.AbiCoder;

				if (bountyClass == 0 || bountyClass == 1 || bountyClass == 3) {
					closerData = abiCoder.encode(['string'], [claimantPullRequestUrl]);
				} else if (bountyClass == 2) {
					console.log(tier);
					closerData = abiCoder.encode(['string', 'uint256'], [claimantPullRequestUrl, tier]);
				} else {
					throw new Error('Undefined class of bounty');
				}

				const txn = await contract.claimBounty(issueId, payoutAddress, closerData, options);

				console.log(`Can withdraw. Transaction hash is ${txn.hash}. Claimant PR is ${claimantPullRequestUrl}`);
				resolve({ txnHash: txn.hash, issueId, closerData });
			} else {
				console.error(BOUNTY_IS_CLAIMED({ issueUrl, payoutAddress, claimantPullRequestUrl }));
				reject(BOUNTY_IS_CLAIMED({ issueUrl, payoutAddress, claimantPullRequestUrl }));
			}
		} catch (error) {
			console.error(error);
			reject(error);
		}
	});
};

module.exports = main;