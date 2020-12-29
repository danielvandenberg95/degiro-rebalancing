/**
 * DataProvider for environment values.
 * @extends DataProvider
 */
export default class Env {
	constructor() {
		this.isOpen = false;
	}

	async open(){
		this.isOpen = true;
	}

	async close(){
		this.isOpen = false;
	}

	async getData(key) {
		if (!this.isOpen){
			throw 'Call open first.';
		}
		return process.env[key];
	}

	async getDataSecure(key) {
		return this.getData(key);
	}
}
