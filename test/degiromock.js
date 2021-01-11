import DeGiro from "../src/degiro";

/**
 * Provides a mock interface for DeGiro. This interface should implement all DeGiro calls. To be used for testing.
 */
export default class DeGiroMock extends DeGiro{

	close(){
		this.isOpen = false;
	}

	getAccountConfig(){
		if (!this.isOpen){
			throw "Not logged in.";
		}
		return {
			data: {
				tradingUrl: 'https://trader.degiro.nl/trading/secure/',
				paUrl: 'https://trader.degiro.nl/pa/secure/',
				reportingUrl: 'https://trader.degiro.nl/reporting/secure/',
				paymentServiceUrl: 'https://trader.degiro.nl/payments/',
				productSearchUrl: 'https://trader.degiro.nl/product_search/secure/',
				dictionaryUrl: 'https://trader.degiro.nl/product_search/config/dictionary/',
				productTypesUrl: 'https://trader.degiro.nl/product_search/config/productTypes/',
				companiesServiceUrl: 'https://trader.degiro.nl/dgtbxdsservice/',
				i18nUrl: 'https://trader.degiro.nl/i18n/',
				vwdQuotecastServiceUrl: 'https://trader.degiro.nl/vwd-quotecast-service/',
				vwdNewsUrl: 'https://solutions.vwdservices.com/customers/degiro.nl/news-feed/api/',
				vwdGossipsUrl: 'https://solutions.vwdservices.com/customers/degiro.nl/news-feed/api/',
				taskManagerUrl: 'https://trader.degiro.nl/taskmanager/',
				refinitivNewsUrl: 'https://trader.degiro.nl/dgtbxdsservice/newsfeed/v2',
				refinitivAgendaUrl: 'https://trader.degiro.nl/dgtbxdsservice/agenda/v2',
				refinitivCompanyProfileUrl: 'https://trader.degiro.nl/dgtbxdsservice/company-profile/v2',
				refinitivCompanyRatiosUrl: 'https://trader.degiro.nl/dgtbxdsservice/company-ratios',
				refinitivFinancialStatementsUrl: 'https://trader.degiro.nl/dgtbxdsservice/financial-statements',
				refinitivClipsUrl: 'https://trader.degiro.nl/refinitiv-insider-proxy/secure/',
				productNotesUrl: 'https://trader.degiro.nl/product-notes-service/secure/',
				landingPath: '/trader/',
				betaLandingPath: '/beta-trader/',
				mobileLandingPath: '/trader/',
				loginUrl: 'https://trader.degiro.nl/login/nl',
				sessionId: '4D4C3124050F67851C06210505150C99.prod_b_111_2',
				clientId: 1478821
			}
		};
	}

	isLoggedIn(){
		return this.isOpen;
	}

	async open(){
		await this.dataProviderLogin.open();
		await this.dataProviderLogin.getData("Username");
		await this.dataProviderLogin.getDataSecure("Password");
		await this.dataProviderLogin.getData("OneTimePassword");
		this.isOpen = true;
	}
	
}
