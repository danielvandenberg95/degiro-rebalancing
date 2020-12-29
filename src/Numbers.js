import pad from 'pad';

/**
 * Converts a number to formatted euro value. Always 8 positions big.
 * (So 5 numbers (or spaces), period, two numbers.)
 * @param {number} value 
 * @returns {string} Format €  xxxxxx.xx
 */
export function toEur(value) {
	return `€${pad(8, Number(value).toFixed(2))}`;
}

/**
 * Converts a number to formatted percentage value. Always 6 positions big.
 * (So 3 numbers (or spaces), period, two numbers.)
 * @param {number} value 
 * @returns {string} Format 100.00%
 */
export function toPercentage(value){
	return `${pad(6, Number(value).toFixed(2))}%`;
}
