const MockClaimManager = {
	claimBounty: async (issueId, payoutAddress, closerData, options, hash = '0x123abc') => {
		return new Promise(async (resolve, reject) => {
			resolve({ hash });
		});
	}
};

module.exports = MockClaimManager;