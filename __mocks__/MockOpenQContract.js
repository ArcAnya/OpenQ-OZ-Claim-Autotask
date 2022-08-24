const MockOpenQContract = {
	isOpen: true,
	get isOpen() {
		return isOpen;
	},
	set isOpen(bool) {
		isOpen = bool;
	},
	isSolvent: true,
	get isSolvent() {
		return isSolvent;
	},
	set isSolvent(bool) {
		isSolvent = bool;
	},
	ongoingClaimedReturn: false,
	get ongoingClaimedReturn() {
		return ongoingClaimedReturn;
	},
	set ongoingClaimedReturn(bool) {
		ongoingClaimedReturn = bool;
	},
	ongoingClaimedMap: {},
	get ongoingClaimedMap() {
		return ongoingClaimedMap;
	},
	set ongoingClaimedMap(claimMap) {
		ongoingClaimedMap = claimMap;
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
	solvent: async (issueId) => {
		return new Promise(async (resolve, reject) => {
			resolve(isSolvent);
		});
	},
	bountyType: async (issueId) => {
		return new Promise(async (resolve, reject) => {
			resolve(bountyTypeReturn);
		});
	},
	ongoingClaimed: async (issueId, claimant, claimantAsset) => {
		return new Promise(async (resolve, reject) => {
			return resolve(ongoingClaimedMap[claimantAsset]);
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
	},
	reset: () => {
		isOpen = true;
		ongoingClaimedReturn = false;
		ongoingClaimedMap = {};
		tierClaimedReturn = false;
		bountyTypeReturn = 0;
		bountyIdToAddressReturn = '0x46e09468616365256F11F4544e65cE0C70ee624b';
	}
};

module.exports = MockOpenQContract;