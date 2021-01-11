/**
 * DataProvider for environment values.
 * @extends DataProvider
 */
class Env {
	/**
	 * Constructor. Nothing special.
	 */
	constructor() {
		this.isOpen = false;
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
		return process.env[key];
	}

	/**
	 * Returns data from the given key. This data is retrieved securely.
	 * To be used e.g. when requesting a password.
	 *
	 * @async
	 * @param {string} key The key associated with the data to get.
	 * @returns {string} The value associated with the given key.
	 */
	async getDataSecure(key) {
		return this.getData(key);
	}

	/**
	 * Opens the DataProvider, allowing to get and set data.
	 *
	 * @async
	 */
	async open() {
		this.isOpen = true;
	}

}
export default Env;
