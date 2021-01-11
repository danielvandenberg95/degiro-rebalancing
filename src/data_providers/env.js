/**
 * DataProvider for environment values.
 * @extends DataProvider
 */
class Env {
	constructor() {
		this.isOpen = false;
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

	async open(){
		this.isOpen = true;
	}
	
}
export default Env;
