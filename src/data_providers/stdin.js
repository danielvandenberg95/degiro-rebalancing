import readline from 'readline';

/**
 * DataProvider that provides data from command line.
 * @extends DataProvider
 */
class StdIn {
	static rl;

	/**
	 * Constructor. Closes any potentially left open StdIn instances.
	 */
	constructor() {
		this.isSecure = false;
		if (StdIn.rl) {
			StdIn.rl.close();
		}
		StdIn.rl = undefined;
	}

	/**
	 * Closes the DataProvider neatly. Used for freeing up system resources.
	 *
	 * @async
	 */
	async close() {
		StdIn.rl?.close();
		StdIn.rl = undefined;
	}

	/**
	 * Returns data from the given key.
	 *
	 * @async
	 * @param {string} key The key associated with the data to get.
	 * @returns {string} The value associated with the given key.
	 */
	async getData(sQuestion) {
		if (!StdIn.rl) {
			throw 'Call open first.';
		}
		StdIn.rl.stdoutMuted = false;
		let promise = new Promise((resolve) => {
			StdIn.rl.question(`${sQuestion}: `, (password) => {
				StdIn.rl.stdoutMuted = false;
				process.stdout.write("\n");
				resolve(password);
			});
		});
		StdIn.rl.stdoutMuted = this.isSecure;
		return promise;
	}

	/**
	 * Returns data from the given key. This data is retrieved securely.
	 * To be used e.g. when requesting a password.
	 *
	 * @async
	 * @param {string} key The key associated with the data to get.
	 * @returns {string} The value associated with the given key.
	 */
	async getDataSecure(sQuestion) {
		this.isSecure = true;
		let result = this.getData(sQuestion);
		this.isSecure = false;
		return result;
	}

	/**
	 * Opens the DataProvider, allowing to get and set data.
	 *
	 * @async
	 */
	async open() {
		StdIn.rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		StdIn.rl._writeToOutput = (stringToWrite) => {
			if (StdIn.rl.stdoutMuted)
				StdIn.rl.output.write("*");
			else
				StdIn.rl.output.write(stringToWrite);
		};
	}

}
export default StdIn;
