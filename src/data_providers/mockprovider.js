/**
 * DataProvider that stores data in-memory. Useful for testing.
 * @extends DataProvider
 */
export default class MockProvider {
	constructor(){
		this.data = {};
	}

	async open() {
		this.isOpen = true;
	}

	async close() {
		this.isOpen = false;
	}

	async getData(key) {
		if (!this.isOpen) {
			throw 'Call open first.';
		}
		return this.data[key];
	}

	setData(key, value) {
		if (!this.isOpen) {
			throw 'Call open first.';
		}
		this.data[key] = value;
	}
}
