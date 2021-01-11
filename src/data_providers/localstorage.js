import './data_provider.js';
import { LocalStorage as LS } from 'node-localstorage';

/**
 * DataProvider that acts as local storage. Stores data on disk.
 * @extends DataProvider
 */
class LocalStorage {

	/**
	 * Closes the DataProvider neatly. Used for freeing up system resources.
	 *
	 * @async
	 */
	async close() {
		this.localStorage = undefined;
	}

	/**
	 * Returns data from the given key.
	 *
	 * @async
	 * @param {string} key The key associated with the data to get.
	 * @returns {string} The value associated with the given key.
	 */
	async getData(key) {
		if (!this.localStorage) {
			throw 'Call open first.';
		}
		return this.localStorage.getItem(key);
	}

	/**
	 * Opens the DataProvider, allowing to get and set data.
	 *
	 * @async
	 */
	async open() {
		this.localStorage = new LS('./storage');
	}

	/**
	 * Sets the data at the given key.
	 * {@link LocalStorage#getData} will return this data, if called with the same key afterwards.
	 *
	 * @param {string} key The key to store the data at.
	 * @param {string} value The value to store at the given key.
	 */
	setData(key, value) {
		if (!this.localStorage) {
			throw 'Call open first.';
		}
		this.localStorage.setItem(key, value);
	}
}
export default LocalStorage;
