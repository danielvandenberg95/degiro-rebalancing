import readline from 'readline';

/**
 * DataProvider that provides data from command line.
 * @extends DataProvider
 */
class StdIn {
	constructor() {
		this.isSecure = false;
		this.rl = undefined;
	}

	async close(){
		this.rl?.close();
		this.rl = undefined;
	}

	async getData(sQuestion) {
		if (!this.rl){
			throw 'Call open first.';
		}
		this.rl.stdoutMuted = false;
		let promise = new Promise((resolve) => {
			this.rl.question(`${sQuestion}: `, (password)=>{
				this.rl.stdoutMuted = false;
				process.stdout.write("\n");
				resolve(password);
			});
		});
		this.rl.stdoutMuted = this.isSecure;
		return promise;
	}

	async getDataSecure(sQuestion){
		this.isSecure = true;
		let result = this.getData(sQuestion);
		this.isSecure = false;
		return result;
	}

	async open(){
		this.rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		this.rl._writeToOutput = (stringToWrite)=>{
			if (this.rl.stdoutMuted)
				this.rl.output.write("*");
			else
				this.rl.output.write(stringToWrite);
		};
	}
	
}
export default StdIn;
