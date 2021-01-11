import readline from 'readline';

/**
 * DataProvider that provides data from command line.
 * @extends DataProvider
 */
class StdIn {
	static rl;

	constructor() {
		this.isSecure = false;
		if (StdIn.rl) {
			StdIn.rl.close();
		}
		StdIn.rl = undefined;
	}

	async close() {
		StdIn.rl?.close();
		StdIn.rl = undefined;
	}

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

	async getDataSecure(sQuestion) {
		this.isSecure = true;
		let result = this.getData(sQuestion);
		this.isSecure = false;
		return result;
	}

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
