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
	bountyClassReturn: 0,
	get bountyClassReturn() {
		return bountyClassReturn;
	},
	set bountyClassReturn(foo) {
		bountyClassReturn = foo;
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
	bountyClass: async (issueId) => {
		return new Promise(async (resolve, reject) => {
			resolve(bountyClassReturn);
		});
	},
	ongoingClaimed: async (issueId) => {
		return new Promise(async (resolve, reject) => {
			resolve(ongoingClaimedReturn);
		});
	},
	tierClaimed: async (issueId, tier) => {
		return new Promise(async (resolve, reject) => {
			resolve(tierClaimedReturn);
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