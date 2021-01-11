/**
 * DataProvider that stores data in-memory. Useful for testing.
 * @extends DataProvider
 */
class MockProvider {
	/**
	 * Constructor. Nothing special.
	 */
	constructor() {
		this.data = {};
	}

	/**
	 * Closes the DataProvider neatly. Used for freeing up system resources.
	 *
	 * @async
	 */
	async close() {
		this.isOpen = false;
	}

	/**
	 * Returns data from the given key.
	 *
	 * @async
	 * @param {string} key The key associated with the data to get.
	 * @returns {string} The value associated with the given key.
	 */
	async getData(key) {
		if (!this.isOpen) {
			throw 'Call open first.';
		}
		return this.data[key];
	}

	/**
	 * Opens the DataProvider, allowing to get and set data.
	 *
	 * @async
	 */
	async open() {
		this.isOpen = true;
	}

	/**
	 * Sets the data at the given key.
	 * {@link MockProvider#getData} will return this data, if called with the same key afterwards.
	 *
	 * @param {string} key The key to store the data at.
	 * @param {string} value The value to store at the given key.
	 */
	setData(key, value) {
		if (!this.isOpen) {
			throw 'Call open first.';
		}
		this.data[key] = value;
	}
}
export default MockProvider;
