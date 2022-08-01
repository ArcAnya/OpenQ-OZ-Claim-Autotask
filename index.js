// Helper methods
const main = require('./main');
const OPENQ_ABI = require('./OpenQABI.json');

// Autotask Entrypoint - constructs signer and contract using Relay
exports.handler = async (event) => {
	let OPENQ_PROXY_ADDRESS;
	switch (event.autotaskId) {
	case '15339346-bb49-4331-9836-1b090145b26d':
		OPENQ_PROXY_ADDRESS = event.secrets.OPENQ_PROXY_ADDRESS_DEVELOPMENT;
		break;
	case 'e448c2ca-24b4-453b-8a44-069badc1bcf2':
		OPENQ_PROXY_ADDRESS = event.secrets.OPENQ_PROXY_ADDRESS_STAGING;
		break;
	case '1224e6b1-20f6-4f55-96b1-f9cf0683ebc8':
		OPENQ_PROXY_ADDRESS = event.secrets.OPENQ_PROXY_ADDRESS_PRODUCTION;
		break;
	default:
		OPENQ_PROXY_ADDRESS = event.secrets.OPENQ_PROXY_ADDRESS;
	}

	const { DefenderRelayProvider, DefenderRelaySigner } = require('defender-relay-client/lib/ethers');
	const { ethers } = require('ethers');

	// Initialize Defender Relay Signer
	const provider = new DefenderRelayProvider(event);
	const signer = new DefenderRelaySigner(event, provider, { speed: 'fastest' });

	// Prepare OpenQ Contract for call
	const openQ = new ethers.Contract(OPENQ_PROXY_ADDRESS, OPENQ_ABI, signer);

	// We then run the main logic in the main function
	try {
		const result = await main(event, openQ);
		return result;
	} catch (error) {
		return error;
	}
};

// Local Provider + Contract Setup
if (require.main === module) {
	const app = require('./app');
	const PORT = 8070;
	app.listen(PORT);
	console.log(`Open Zeppelin Autotask listening on ${PORT}`);
}