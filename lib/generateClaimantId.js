const ethers = require('ethers');

const generateClaimantId = (claimant, claimantAsset) => {
	const abiCoder = new ethers.utils.AbiCoder;
	const abiEncodedParams = abiCoder.encode(['string', 'string'], [claimant, claimantAsset]);
	const claimantId = ethers.utils.keccak256(abiEncodedParams);
	return claimantId;
};

module.exports = generateClaimantId;