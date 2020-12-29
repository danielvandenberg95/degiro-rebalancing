import colors from 'colors/safe.js';
import Console from 'console';
import pad from 'pad';
// hideconstructor Needed as otherwise jsdoc generates an empty constructor. TODO: Figure out why / fix.

/**
 * CLI provides a mean for interacting with your application through CLI.
 * @hideconstructor
 *
 */
export default class CLI {

	headerLines = [];
	subMenus = [];
	isExiting = false;

	/**
	 * Creates a CLI.
	 * @constructor CLI
	 * @param {DataProvider} dataProvider The dataprovider to use for user interaction.
	 */
	constructor(dataProvider) {
		this.dataProvider = dataProvider;
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
	 * Adds a submenu.
	 * @param {string} title The title of the submenu. Shown when selecting and on top as a header line.
	 */
	addSubMenu(title) {
		let subConsole = new CLI(this.dataProvider);
		this.addFunction(title, () => { return subConsole.loop(); });
		subConsole.addHeaderLine(title);
		return subConsole;
	}

	/**
	 * A function returning either a string or a stringarray.
	 * @typedef {function} CLI#StringFunc
	 * @returns {string[] | string}
	 */

	/**
	 * Adds a line to be displayed in the interface.
	 * @param {CLI#StringFunc | string | string[]} func_header Header function
	 */
	addHeaderLine(func_header) {
		this.headerLines.push(func_header);
		return this;
	}

	/**
	 * Private render function.
	 * Renders the current "screen" to the console.
	 * 
	 * @private
	 * @async
	 */
	async #render() {
		Console.clear();
		for (let e of this.headerLines) {
			if (typeof (e) === "function") {
				e = await e();
			}
			if (Array.isArray(e)) {
				e.forEach(e => Console.log(e));
			}
			else {
				Console.log(e);
			}
		}
		this.subMenus.forEach((obj, index) => {
			Console.log(`${pad(2, index + 1)} - ${obj.title}`);
		});
	}

	/**
	 * Main loop of CLI. Call this to start the interface.
	 * 
	 * @async
	 */
	async loop() {
		this.isExiting = false;
		while (!this.isExiting) {
			await this.#render();
			let option = 1 * await this.dataProvider.getData("Option");
			let func = this.subMenus[option - 1]?.func;
			if (func) {
				Console.clear();
				Console.log(colors.red.bold(this.subMenus[option - 1].title));
				let ret = await func();
				if (ret) {
					if (Array.isArray(ret)) {
						ret.forEach(e => Console.log(e));
					}
					else {
						Console.log(ret);
					}
				}
			} else {
				Console.log("Unknown option.");
			}
			if (!this.isExiting) {
				await this.dataProvider.getData("Press enter key to continue.");
			}
		}

	}
}
