import colors from 'colors/safe.js';
import Console from 'console';

/** CLI class. Gives an CLI interface for easy user interaction. */
class CLI {
	isExiting = false;

	/**
	 * Constructor.
	 * @param {string} title Title
	 * @param {function} onLoad Function to be called on load. Add components in here if they need to be re-rendered.
	 */
	constructor(title, onLoad) {
		this.title = title;
		this.onLoad = onLoad;
		this.clear();
		if (title) {
			this.addHeaderLine(title);
		}
		this.addFunction("Exit", () => { this.isExiting = true; });
	}

	/**
	 * Adds a function to the CLI.
	 * @param {string} title The title of this function.
	 * @param {function} func The function to be executed.
	 */
	addFunction(title, func) {
		this.subMenus.push({ title, func });
		return this;
	}

	/**
	 * Adds a line to be displayed in the interface.
	 * @param {CLI#StringFunc | string | string[]} func_header Header function
	 */
	addHeaderLine(func_header) {
		this.headerLines.push(func_header);
		return this;
	}

	/**
	 * Adds a submenu.
	 * @param {string} title The title of the submenu. Shown when selecting and on top as a header line.
	 */
	addSubMenu(title, onLoad) {
		let subConsole = new CLI(title, onLoad);
		this.addFunction(title, () => {
			return subConsole.#loop();
		});
		subConsole.addHeaderLine(title);
		return this;
	}

	/**
	 * A function returning either a string or a stringarray.
	 * @typedef {function} CLI#StringFunc
	 * @returns {string[] | string}
	 */

	/**
	 * Requests user input.
	 * @param {string} comment Comment to add before asking for user input.
	 */
	async askUserInput(comment) {
		let lastKey;
		let sequence = ``;
		process.stdout.write(comment);
		process.stdout.write("\r\n");
		while (
			lastKey = await this.#getKey(),
			lastKey.name != `return`
		) {

			switch (lastKey.name) {
				case `backspace`:
					sequence = sequence.split(0, -1);
					process.stdout.moveCursor(-1, 0);
					process.stdout.write(" ");
					process.stdout.moveCursor(-1, 0);
					break;
				default:
					if (lastKey.sequence.length == 1) {
						sequence += lastKey.sequence;
						process.stdout.write(lastKey.sequence);
					}
			}
		}
		process.stdout.write('\r\n');
		return sequence;
	}

	/**
	 * Let the user chose from the given options.
	 * @param {string} title Title to display above options
	 * @param {any[]} options Array of options
	 * @param {function(any):string} formatter Formatter for options
	 */
	async askUserSelection(title, options, formatter) {
		let selectCLI = new CLI(title);
		return await new Promise((resolve) => {
			options.forEach((option, index) => {
				selectCLI.addFunction(`${formatter(option)}`, async () => {
					selectCLI.setExiting();
					resolve(options[index]);
				});
			});
			selectCLI.run();
		});
	}

	/**
	 * Removes any header lines or functions.
	 */
	clear() {
		this.headerLines = [];
		this.subMenus = [];
	}

	/**
	 * Main loop of the CLI. Call this to start the interface. Initializes tty.
	 */
	async run() {
		let wasRaw = process.stdin.isRaw;
		process.stdin.setRawMode(true);
		await this.#loop();
		process.stdin.setRawMode(wasRaw);
	}

	/**
	 * Tells the CLI that it should exit as soon as possible.
	 */
	setExiting() {
		this.isExiting = true;
	}

	/**
	 * Main loop of CLI. 
	 * 
	 * @async
	 */
	async #loop() {
		this.isExiting = false;
		while (!this.isExiting) {
			if (this.onLoad) {
				this.clear();
				this.addHeaderLine(this.title);
				this.addFunction("Exit", () => { this.isExiting = true; });
				this.onLoad();
			}
			let selected = 0;

			let key;
			let lines = await this.#render();
			do {
				key = await this.#getKey();
				let selectedNew = selected;
				switch (key.name) {
					case `up`:
						selectedNew = Math.max(0, selected - 1);
						break;
					case `down`:
						selectedNew = Math.min(this.subMenus.length - 1, selected + 1);
						break;
				}
				if (selectedNew != selected) {
					process.stdout.cork();
					process.stdout.cursorTo(0, lines[selected]);
					process.stdout.write(` `);
					selected = selectedNew;
					process.stdout.cursorTo(0, lines[selected]);
					process.stdout.write(`→`);
					process.stdout.cursorTo(0, lines[lines.length - 1] + 1);
					process.stdout.uncork();
				}
			} while (key.name != `return`);
			let func = this.subMenus[selected]?.func;
			let hasOutput = false;
			if (func) {
				Console.clear();
				Console.log(colors.red.bold(this.subMenus[selected].title));
				let ret = await func.call(this);
				if (ret) {
					if (Array.isArray(ret)) {
						hasOutput = ret.length > 0;
						ret.forEach(e => Console.log(e));
					}
					else {
						hasOutput = !!ret;
						Console.log(ret);
					}
				}
			} else {
				Console.log("Unknown option.");
			}
			if (!this.isExiting && hasOutput) {
				Console.log("Press enter key to continue.");
				// eslint-disable-next-line no-empty
				while ((await this.#getKey()).name != `return`) { }
			}
		}
	}

	/**
	 * Private render function.
	 * Renders the current "screen" to the console.
	 * 
	 * @private
	 * @async
	 */
	async #render() {
		process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
		process.stdout.write("\x1B[2J");
		Console.clear();
		let lines = 0
		for (let e of this.headerLines) {
			if (typeof (e) === "function") {
				e = await e();
			}
			if (Array.isArray(e)) {
				lines += e.length;
				e.forEach(e => Console.log(e));
			}
			else {
				lines++;
				Console.log(e);
			}
		}
		let indexes = [];
		this.subMenus.forEach((obj, index) => {
			indexes.push(lines);
			lines++;
			Console.log(`${index === 0 ? `→` : ` `} ${obj.title}`);
		});
		return indexes;
	}

	/**
		 * Returns a keypress.
		 * @returns {Object} The key pressed.
		 */
	async #getKey() {
		process.stdin.resume();
		process.stdin.setEncoding('utf8');
		return new Promise((resolve) => {
			process.stdin.once('keypress', (str, key) => {
				process.stdin.pause();
				resolve(key);
			});
		});
	}

}
export default CLI;
