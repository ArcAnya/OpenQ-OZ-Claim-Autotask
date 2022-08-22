const closerCommentRegex = require('../lib/closerCommentRegex');

describe('closerCommentRegex', () => {
	// Well-formed strings
	let simpleCloses = 'Closes #14';
	let simpleFixes = 'fixes #1';
	let closesOrg = 'Closes OpenQDev/OpenQ-TestRepo#143';
	let multipleCloses = 'this Closes #14 and later also closes OpenQDev/OpenQ-TestRepo#543 and other things';
	let followedByNewLine = 'Closes #12\n';
	let followedByCarriageReturn = 'Closes #517\r';
	let mess = 'closes https://github.com/honey-labs/honey-frontend/issues/151\r\n\r\nInitial MVP';

	// Malformed/Non-existent closer comment
	let noCloser = 'I contain no closer';
	let malformed = 'Closer #d';

	it('Returns true and proper number for well-formed closer comments', async () => {
		expect(closerCommentRegex(simpleCloses, 'OpenQDev', 'OpenQ-TestRepo')).toEqual([14]);
		expect(closerCommentRegex(simpleFixes, 'OpenQDev', 'OpenQ-TestRepo')).toEqual([1]);
		expect(closerCommentRegex(closesOrg, 'OpenQDev', 'OpenQ-TestRepo')).toEqual([143]);
		expect(closerCommentRegex(noCloser, 'OpenQDev', 'OpenQ-TestRepo')).toEqual([]);
		expect(closerCommentRegex(multipleCloses, 'OpenQDev', 'OpenQ-TestRepo')).toEqual([14, 543]);
		expect(closerCommentRegex(followedByNewLine, 'OpenQDev', 'OpenQ-TestRepo')).toEqual([12]);
		expect(closerCommentRegex(followedByCarriageReturn, 'OpenQDev', 'OpenQ-TestRepo')).toEqual([517]);
		expect(closerCommentRegex(mess, 'honey-labs', 'honey-frontend')).toEqual([151]);
	});

	it('Returns false and undefined for no closer or malformed closer', async () => {
		expect(closerCommentRegex(noCloser, 'OpenQDev', 'OpenQ-TestRepo')).toEqual([]);
		expect(closerCommentRegex(malformed, 'OpenQDev', 'OpenQ-TestRepo')).toEqual([]);
	});
});