import colors from 'colors/safe.js';
import DeGiroTmp from 'degiro-api';
import Portfolio from './portfolio.js';
import { PORTFOLIO_POSITIONS_TYPE_ENUM } from 'degiro-api/dist/enums/index.js';
import { toEur } from './Numbers.js';

const DeGiroAPI = DeGiroTmp.default;

/**
 * Class for interacting with DeGiro.
 */
class DeGiro {
	/**
	 * Constructor.
	 * @param {DataProvider} dataProviderLogin DataProvider to request the login credentials from.
	 * @param {DataProvider} dataProviderLoginCache DataProvider to cache the auth token in.
	 */
	constructor(dataProviderLogin, dataProviderLoginCache) {
		this.dataProviderLogin = dataProviderLogin;
		this.dataProviderLoginCache = dataProviderLoginCache;
	}

	/** 
	 * Closes the connection to degiro and closes the dataproviders, freeing up system resources.
	*/
	close() {
		this.degiro.logout();
		this.dataProviderLogin.close();
		this.dataProviderLoginCache.close();
	}

	/**
	 * Returns the current available balance.
	 * @async
	 * @returns {number} The current balance.
	 */
	async getBalance() {
		return (await this.degiro.getCashFunds()).find(e => e.currencyCode === 'EUR').value;
	}

	/**
	 * Returns the current balance as a formatted string.
	 * @async
	 * @returns {string} <blue>Balance:</blue> €xxxx.xx
	 */
	async getBalanceString(){
		return `${colors.blue(`Balance:`)} ${toEur(await this.getBalance())}`;
	}

	/**
	 * Returns the current portfolio.
	 * @async
	 * @returns {Promise<Portfolio>} The portfolio.
	 */
	async getPortfolio() {
		let portfolio = await this.degiro.getPortfolio({
			type: PORTFOLIO_POSITIONS_TYPE_ENUM.ALL,
			getProductDetails: true,
		});
		let productIds = portfolio.map(e => e.id);
		let positions = await this.getProductsByIds(productIds);
		portfolio = portfolio.map(e => {
			return {
				entry: positions[e.id],
				...e
			}
		});
		return new Portfolio(portfolio);
	}

	/**
	 * Fetches the information for the products by the given ID.
	 * @param {number[]} ids The IDs of the products to get the information from.
	 * @async
	 * @returns product information.
	 */
	async getProductsByIds(ids){
		return this.degiro.getProductsByIds(ids);
	}

	/**
	 * Call to open both data providers, and establish a connection to degiro.
	 * 
	 * @async
	 */
	async open() {
		await this.dataProviderLogin.open();
		await this.dataProviderLoginCache.open();
		if (await this.dataProviderLoginCache.getData("degiro.logincache")) {
			this.degiro = new DeGiroAPI({
				jsessionId: await this.dataProviderLoginCache.getData("degiro.logincache")
			});
			await this.degiro.login().catch((e) => { console.log(`Invalid login: ${e}`) });
			if (this.degiro.isLogin()) {
				return;
			}
		}

		console.log("Session expired (or non-existing yet), re-login.");

		this.degiro = new DeGiroAPI({
			username: await this.dataProviderLogin.getData("Username"),
			pwd: await this.dataProviderLogin.getDataSecure("Password"),
			oneTimePassword: await this.dataProviderLogin.getData("OneTimePassword")
		});
		await this.degiro.login();
		if (!this.degiro.isLogin()) {
			throw "Could not login.";
		}
		this.dataProviderLoginCache.setData("degiro.logincache", this.degiro.getJSESSIONID());
	}
	
	/**
	 * Searches products in DEGIRO.
	 * @param {string} searchOptions The search string.
	 * @returns The products with the given search string.
	 */
	async searchProduct(searchOptions){
		return await this.degiro.searchProduct(searchOptions) || [];
	}
}
export default DeGiro;
