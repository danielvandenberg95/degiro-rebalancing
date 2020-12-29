/**
 * @file Provides an interface for DataProviders.
 * @author Daniël van den Berg
 */

/**
 * Provides functions to get (and optionally set) data.
 * @abstract
 * @interface DataProvider
 */

/**
 * Opens the DataProvider, allowing to get and set data.
 *
 * @async
 * @abstract
 * @function DataProvider#open
 */

/**
 * Closes the DataProvider neatly. Used for freeing up system resources.
 *
 * @async
 * @abstract
 * @function DataProvider#close
 */

/**
 * Returns data from the given key.
 *
 * @async
 * @abstract
 * @function DataProvider#getData
 * @param {string} key The key associated with the data to get.
 * @returns {string} The value associated with the given key.
 */

/**
 * Returns data from the given key. This data is retrieved securely.
 * To be used e.g. when requesting a password.
 *
 * @async
 * @abstract
 * @function DataProvider#getDataSecure
 * @param {string} key The key associated with the data to get.
 * @returns {string} The value associated with the given key.
 */

/**
 * Sets the data at the given key.
 * {@link DataProvider#getData} will return this data, if called with the same key afterwards.
 *
 * @abstract
 * @function DataProvider#setData
 * @param {string} key The key to store the data at.
 * @param {string} value The value to store at the given key.
 */
