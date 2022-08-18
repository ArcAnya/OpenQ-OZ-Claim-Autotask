const MockOpenQContract = {
	isOpen: true,
	get isOpen() {
		return isOpen;
	},
	set isOpen(bool) {
		isOpen = bool;
	},
	ongoingClaimedReturn: false,
	get ongoingClaimedReturn() {
		return ongoingClaimedReturn;
	},
	set ongoingClaimedReturn(bool) {
		ongoingClaimedReturn = bool;
	},
	tierClaimedReturn: false,
	get tierClaimedReturn() {
		return tierClaimedReturn;
	},
	set tierClaimedReturn(bool) {
		tierClaimedReturn = bool;
	},
	bountyTypeReturn: 0,
	get bountyTypeReturn() {
		return bountyTypeReturn;
	},
	set bountyTypeReturn(foo) {
		bountyTypeReturn = foo;
	},
	bountyIdToAddressReturn: '0x46e09468616365256F11F4544e65cE0C70ee624b',
	get bountyIdToAddressReturn() {
		return; bountyIdToAddressReturn;
	},
	set bountyIdToAddressReturn(foo) {
		bountyIdToAddressReturn = foo;
	},
	bountyIsOpen: async (issueId) => {
		return new Promise(async (resolve, reject) => {
			resolve(isOpen);
		});
	},
	bountyType: async (issueId) => {
		return new Promise(async (resolve, reject) => {
			resolve(bountyTypeReturn);
		});
	},
	ongoingClaimed: async (issueId, claimant, claimantAsset) => {
		return new Promise(async (resolve, reject) => {
			if (claimant == 'FlacoJones' && claimantAsset == 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/138') {
				return resolve(true);
			} else if (claimant == 'FlacoJones' && claimantAsset == 'https://github.com/OpenQDev/OpenQ-TestRepo/pull/452') {
				return resolve(ongoingClaimedReturn);
			} else {
				return resolve(false);
			}
		});
	},
	tierClaimed: async (issueId, tier) => {
		return new Promise(async (resolve, reject) => {
			if (tier == 0 && issueId == 'I_kwDOGWnnz85GjwA1') {
				return resolve(true);
			} else {
				return resolve(tierClaimedReturn);
			}
		});
	},
	bountyIdToAddress: async (issueId) => {
		return new Promise(async (resolve, reject) => {
			resolve(bountyIdToAddressReturn);
		});
	},
	claimBounty: async (issueId, payoutAddress, closerData, options, hash = '0x123abc') => {
		return new Promise(async (resolve, reject) => {
			resolve({ hash });
		});
	}
};

module.exports = MockOpenQContract;