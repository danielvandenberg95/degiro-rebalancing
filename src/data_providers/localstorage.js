import './data_provider.js';
import { LocalStorage as LS } from 'node-localstorage';

/**
 * DataProvider that acts as local storage. Stores data on disk.
 * @extends DataProvider
 */
class LocalStorage {
	async open() {
		this.localStorage = new LS('./storage');
	}

	async close() {
		this.localStorage = undefined;
	}

	async getData(key) {
		if (!this.localStorage) {
			throw 'Call open first.';
		}
		return this.localStorage.getItem(key);
	}

	setData(key, value) {
		if (!this.localStorage) {
			throw 'Call open first.';
		}
		this.localStorage.setItem(key, value);
	}
}
export default LocalStorage;
