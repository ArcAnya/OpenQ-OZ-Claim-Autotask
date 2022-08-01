const checkWithdrawalEligibilityImpl = require('./lib/checkWithdrawalEligibility');
const validateSignedOauthTokenImpl = require('./lib/validateSignedOauthToken');
const { BOUNTY_IS_CLAIMED } = require('./errors');
const ethers = require('ethers');
const generateClaimantId = require('./lib/generateClaimantId');

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
			const { canWithdraw, issueId, claimantAsset, claimant, tier } = await checkWithdrawalEligibility(issueUrl, oauthToken, event.secrets.PAT);

			const bountyAddress = await contract.bountyIdToAddress(issueId);
			const issueIsOpen = await contract.bountyIsOpen(issueId);
			const bountyClass = await contract.bountyClass(issueId);

			if (canWithdraw && issueIsOpen) {
				const options = { gasLimit: 3000000 };

				let closerData;
				const abiCoder = new ethers.utils.AbiCoder;

				if (bountyClass == 1) {
					const claimantId = generateClaimantId(claimant, claimantAsset);
					const ongoingClaimed = await contract.ongoingClaimed(claimantId);
					if (ongoingClaimed) {
						throw new Error(`Ongoing Bounty has already been claimed by ${claimant} for ${claimantAsset}.`);
					}
					closerData = abiCoder.encode(['address', 'string', 'address', 'string'], [bountyAddress, claimant, payoutAddress, claimantAsset]);
				} else if (bountyClass == 2) {
					closerData = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [bountyAddress, claimant, payoutAddress, claimantAsset, tier]);
				} else {
					throw new Error('Undefined class of bounty');
				}

				const txn = await contract.claimBounty(issueId, payoutAddress, closerData, options);

				console.log(`Can withdraw. Transaction hash is ${txn.hash}. Claimant PR is ${claimantAsset}`);
				resolve({ txnHash: txn.hash, issueId, closerData });
			} else {
				console.error(BOUNTY_IS_CLAIMED({ issueUrl, payoutAddress, claimantAsset }));
				reject(BOUNTY_IS_CLAIMED({ issueUrl, payoutAddress, claimantAsset }));
			}
		} catch (error) {
			console.error(error);
			reject(error);
		}
	});
};

module.exports = main;