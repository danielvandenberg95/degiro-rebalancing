import colors from 'colors/safe.js';
import DeGiroTmp from 'degiro-api';
import { PORTFOLIO_POSITIONS_TYPE_ENUM } from 'degiro-api/dist/enums/index.js';

const DeGiroAPI = DeGiroTmp.default;

export default class DeGiro {
	constructor(dataProviderLogin, dataProviderLoginCache) {
		this.dataProviderLogin = dataProviderLogin;
		this.dataProviderLoginCache = dataProviderLoginCache;
	}

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

	close() {
		this.dataProviderLogin.close();
	}

	async getBalance() {
		return (await this.degiro.getCashFunds()).find(e => e.currencyCode === 'EUR').value;
	}

	async getBalanceString(){
		return `${colors.blue(`Balance:`)} €${Number(await this.getBalance()).toFixed(2)}`;
	}

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
		return portfolio;
	}

	async getProductsByIds(ids){
		return this.degiro.getProductsByIds(ids);
	}

	isLoggedIn() {
		return this.degiro.isLogin();
	}

	async searchProduct(searchOptions){
		return await this.degiro.searchProduct(searchOptions) || [];
	}
}
