/**
 * DataProvider that stores data in-memory. Useful for testing.
 * @extends DataProvider
 */
class MockProvider {
	constructor(){
		this.data = {};
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

	async open() {
		this.isOpen = true;
	}

	setData(key, value) {
		if (!this.isOpen) {
			throw 'Call open first.';
		}
		this.data[key] = value;
	}
}
export default MockProvider;
