import pad from 'pad';

// hideconstructor Needed as otherwise jsdoc generates an empty constructor. TODO: Figure out why / fix.

/**
 * Euro provides a simple class for formatting currencies.
 * @hideconstructor
 *
 */
class Euro {
	/**
	 * Class to represent euro values.
	 * @param {number} value 
	 */
	constructor(value) {
		this.value = value;
	}

	/**
	 * Converts the given value to a string.
	 * @returns {string} Format €xxxxxx.xx
	 */
	toString() {
		return `€${pad(8, Number(this.value).toFixed(2))}`;
	}
}

/**
 * Converts a number to formatted euro value.
 * @param {number} value 
 * @returns {string} Format €xxxxxx.xx
 */
export function toEur(value) {
	return new Euro(value).toString();
}
