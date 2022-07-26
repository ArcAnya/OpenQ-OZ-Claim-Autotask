const MockOpenQContract = {
	isOpen: true,
	get isOpen() {
		return isOpen;
	},
	set isOpen(bool) {
		isOpen = bool;
	},
	bountyClassReturn: 0,
	get bountyClassReturn() {
		return bountyClassReturn;
	},
	set bountyClassReturn(foo) {
		bountyClassReturn = foo;
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
	claimBounty: async (issueId, payoutAddress, closerData, options, hash = '0x123abc') => {
		return new Promise(async (resolve, reject) => {
			resolve({ hash });
		});
	}
};

module.exports = MockOpenQContract;