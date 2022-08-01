const { NO_GITHUB_OAUTH_TOKEN, INVALID_GITHUB_OAUTH_TOKEN } = require('../errors');
const unsignOauthToken = require('./unsignOauthToken');

const validateSignedOauthToken = (payoutAddress, event) => {
	return new Promise(async (resolve, reject) => {

		let cookieSigner;
		switch (event.autotaskId) {
			case '15339346-bb49-4331-9836-1b090145b26d':
				cookieSigner = event.secrets.COOKIE_SIGNER_DEVELOPMENT;
				break;
			case 'e448c2ca-24b4-453b-8a44-069badc1bcf2':
				cookieSigner = event.secrets.COOKIE_SIGNER_STAGING;
				break;
			case '1224e6b1-20f6-4f55-96b1-f9cf0683ebc8':
				cookieSigner = event.secrets.COOKIE_SIGNER_PRODUCTION;
				break;
			default:
				cookieSigner = event.secrets.COOKIE_SIGNER;
		}

		let signedOAuthToken;
		if (event.request && event.request.headers) {
			signedOAuthToken = event.request.headers['x-authorization'];
			if (!signedOAuthToken) {
				signedOAuthToken = event.request.headers['X-Authorization'];
			}
			if (!signedOAuthToken) {
				return reject(NO_GITHUB_OAUTH_TOKEN({ payoutAddress }));
			}
		} else {
			return reject(NO_GITHUB_OAUTH_TOKEN({ payoutAddress }));
		}

		/* Since we are not using Express.js for this oracle running as a lambda,
			 we must manually unsign the OAuth token from the header */
		const oauthToken = unsignOauthToken(signedOAuthToken, cookieSigner);

		if (!oauthToken) {
			return reject(INVALID_GITHUB_OAUTH_TOKEN({ payoutAddress }));
		}

		return resolve(oauthToken);
	});
};

module.exports = validateSignedOauthToken;