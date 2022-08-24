const checkWithdrawalEligibilityImpl = require('./lib/checkWithdrawalEligibility');
const validateSignedOauthTokenImpl = require('./lib/validateSignedOauthToken');
const { BOUNTY_IS_CLAIMED, BOUNTY_IS_INSOLVENT } = require('./errors');
const ethers = require('ethers');

const main = async (
	event,
	contract,
	claimManager,
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
			const { canWithdraw, issueId, claimantAsset, claimant, tier } = await checkWithdrawalEligibility(issueUrl, oauthToken, event.secrets.PAT, contract, payoutAddress);

			const bountyType = await contract.bountyType(issueId);
			const bountyAddress = await contract.bountyIdToAddress(issueId);
			let issueIsOpen = await contract.bountyIsOpen(issueId);

			// For competition it is flipped - can only claim 
			if (bountyType == 2 || bountyType == 3) {
				issueIsOpen = !issueIsOpen;
			}

			if (bountyType == 1) {
				console.log(contract);
				let solvent = await contract.solvent(issueId);
				if (!solvent) {
					reject(BOUNTY_IS_INSOLVENT({ issueUrl, payoutAddress }));
				}
			}

			if (canWithdraw && issueIsOpen) {
				const options = { gasLimit: 3000000 };

				let closerData;
				const abiCoder = new ethers.utils.AbiCoder;

				if (bountyType == 0) {
					closerData = abiCoder.encode(['address', 'string', 'address', 'string'], [bountyAddress, claimant, payoutAddress, claimantAsset]);
				} else if (bountyType == 1) {
					closerData = abiCoder.encode(['address', 'string', 'address', 'string'], [bountyAddress, claimant, payoutAddress, claimantAsset]);
				} else if (bountyType == 2 || bountyType == 3) {
					closerData = abiCoder.encode(['address', 'string', 'address', 'string', 'uint256'], [bountyAddress, claimant, payoutAddress, claimantAsset, tier]);
				} else {
					throw new Error('Undefined class of bounty');
				}

				const txn = await claimManager.claimBounty(bountyAddress, payoutAddress, closerData, options);

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