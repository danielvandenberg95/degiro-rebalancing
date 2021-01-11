import { toEur, toPercentage } from './Numbers.js';
import CLI from './CLI.js';
import colors from 'colors/safe.js';
import DeGiro from './degiro.js';
import LocalStorage from './data_providers/localstorage.js';
import pad from 'pad';
import RequestedProducts from './RequestedProducts.js';
import StdIn from './data_providers/stdin.js';

/**
 * Main loop wrapper for catching exceptions.
 */
async function loopMain() {
	let isExiting = false;
	while (!isExiting) {
		try {
			await main();
			isExiting = true;
		} catch (e) { /*ignore*/ }
	}
}

/**
 * Main function, runs the program.
 */
async function main() {
	let stdIn = new StdIn();
	let lsStorage = new LocalStorage();

	const degiro = new DeGiro(stdIn, lsStorage);
	await degiro.open();

	let requestedProducts = new RequestedProducts(new LocalStorage());
	await requestedProducts.open();

	/**
	 * Adds portfolio information to the array of positions.
	 * @param {Position[]} positions Array of positions to fill with data.
	 */
	async function addPortfolioInfo(positions) {
		let portfolio = await degiro.getPortfolio();
		let totalValue = portfolio.getTotalValue() || Number.MIN_VALUE;
		return positions.map(e => {
			let value = portfolio.findByID(e.id)?.value || 0;
			let acutalPercentage = value / totalValue * 100;
			let percentageError = acutalPercentage - (e.percentage || 0);
			return {
				...e,
				value,
				percentageGoal: e.percentage || 0,
				acutalPercentage,
				percentageError,
				totalValue,
				refreshPercentages: function () {
					this.acutalPercentage = this.value / this.totalValue * 100;
					this.percentageError = this.acutalPercentage - (this.percentage || 0);
				}
			}
		})
	}

	/**
	 * Formats the given product.
	 * @param {product} e The product to format
	 * @param {boolean} [withPercentage=true] if the leading percentage should be added or not
	 * @returns The product as a human readable string in the format "  2.50% -  ETF - JE00B1VS3W29 - WisdomTree Physical Precious Metals ETC"
	 */
	function formatRequestedProduct(e, withPercentage = true) {
		return `${withPercentage ? `${toPercentage(e.percentage)} - ` : ``}${pad(4, e.productType || '')} - ${pad('IE00B579F325'.length, e.isin)} - ${e.name}`;
	}

	/**
	 * Requests that the user picks one option from multiple options.
	 * @param {CLI} cli The currently running CLI.
	 * @param {any[]} products The options to pick from.
	 * @returns A promise of the given product.
	 */
	function selectProduct(cli, products) {
		return cli.askUserSelection("Select product", products, formatRequestedProduct);
	}

	let newConsole = new CLI(colors.red.bold("DEGIRO - rebalance help"));
	newConsole
		.addHeaderLine(async () => degiro.getBalanceString())
		.addFunction("Show positions", async () => {
			let portfolio = await degiro.getPortfolio();
			portfolio = portfolio.data.map(e => {
				return {
					entry: e.entry.name,
					size: e.size,
					price: e.price,
					value: e.value
				}
			});
			return portfolio;
		})
		.addFunction("Show status", async () => {
			let portfolio = await degiro.getPortfolio();
			let totalValue = portfolio.getTotalValue();
			portfolio.data = portfolio.data.map(e => { return { ...e, found: false }; });
			console.log(`${colors.blue(`Current total value: `)}${toEur(totalValue)}`);

			await requestedProducts.enrich(degiro);
			requestedProducts.positions.forEach(e => {
				let pf = portfolio.findByID(e.id);
				if (pf) {
					pf.found = true;
				}
			});

			return (await addPortfolioInfo(requestedProducts.positions
				.concat(portfolio.data.filter(e => !e.found).map(e => { return { e, ...e.entry }; }))))
				.map(e => {
					let percentageString = `${toPercentage(e.acutalPercentage)} / ${toPercentage(e.percentageGoal)}`;
					let iDifference = e.percentageError / (e.percentage || Number.MIN_VALUE) * percentageString.length;
					iDifference = Math.round(iDifference);
					let startIndex = Math.min(iDifference, 0) + (percentageString.length - 1) / 2;
					let endIndex = Math.max(iDifference, 0) + (percentageString.length + 1) / 2;
					startIndex = Math.min(percentageString.length, Math.max(0, startIndex));
					endIndex = Math.min(percentageString.length, Math.max(0, endIndex));

					const colorArray = { 1: "bgGreen", 3: "bgBrightGreen", 7: "bgBrightRed", Infinity: "bgRed" };
					let color = colorArray[Object.keys(colorArray).find(e => e >= Math.abs(iDifference))];
					let colorFn = colors[color];
					percentageString =
						percentageString.substr(0, startIndex) +
						colorFn(percentageString.substr(startIndex, endIndex - startIndex)) +
						percentageString.substr(endIndex, percentageString.length - endIndex)
					return {
						...e,
						percentageString
					};
				})
				.map(e => `${toEur(e.value)} - ${e.percentageString} - ${formatRequestedProduct(e, false)}`)
		})
		.addFunction("Show recommendation (buy only)", async () => {
			console.log(await degiro.getBalanceString());
			await requestedProducts.enrich(degiro);
			let requestedPositions = (await addPortfolioInfo(requestedProducts.positions))
				.map(e => { return { ...e, buyPrice: e.entry.closePrice } });//TODO: Make current price once supported by degiro-api.
			let balance = await degiro.getBalance();
			let requestedPositionsCopy = requestedPositions;
			let buy = {};
			while (
				requestedPositions = requestedPositions.filter(e => e.buyPrice < balance),
				requestedPositions.length != 0) {

				requestedPositions.sort((a, b) => a.percentageError - b.percentageError);
				let buyPosition = requestedPositions[0];
				balance -= buyPosition.buyPrice;
				buyPosition.value += buyPosition.buyPrice;
				requestedPositions.forEach(e => {
					e.totalValue += buyPosition.buyPrice;
					e.refreshPercentages();
				});
				buy[buyPosition.id] = (buy[buyPosition.id] || 0) + 1;
			}
			buy = Object.keys(buy).map(e => { return { id: e, count: buy[e] }; })
				.map(e => {
					return {
						entry: requestedPositionsCopy.find(rp => rp.id === e.id),
						count: e.count
					};
				})
				.map(e => {
					return {
						name: e.entry.name,
						isin: e.entry.isin,
						count: e.count,
						buyPrice: e.entry.buyPrice,
						endValue: e.entry.value
					}
				});
			return buy.map(e => `Buy ${colors.green(pad(3, e.count))} x ${colors.blue(e.isin)} at a price of ${colors.green(toEur(e.buyPrice))} for a final value of ${colors.green(toEur(e.endValue))} - ${colors.blue(e.name)}`);
		});

	newConsole
		.addSubMenu("Manage requested positions", async function () {
			this
				.addHeaderLine(async () => {
					return (requestedProducts.positions)
						.map(e => `${formatRequestedProduct(e)}`);
				})
				.addFunction("Set percentage", async function () {
					let products = (requestedProducts.positions);
					let product = await selectProduct(this, products);
					if (!product) {
						return "Cancelled.";
					}
					product.percentage = 1 * await this.askUserInput("Percentage", { type: "number" });
					requestedProducts.save();
				})
				.addFunction("Add position", async function () {
					let ret = this.askUserInput("Search for position");
					let text = await ret;
					let products = await degiro.searchProduct({ text });
					if (products.length == 0) {
						console.log("None found.");
						return "none found.";
					}
					let product;
					let promise = selectProduct(this, products);
					product = await promise;
					if (!product) {
						return "Cancelled.";
					}
					product.percentage = 0;
					requestedProducts.positions.push(product);
					requestedProducts.save();
				})
				.addFunction("Remove position", async function () {
					let product = await selectProduct(this, requestedProducts.positions);
					if (!product) {
						return "Cancelled.";
					}
					requestedProducts.positions = requestedProducts.positions.filter(e => e != product);
					requestedProducts.save();
				});
		});

	stdIn.close();
	await newConsole.run();

	requestedProducts.close();
	degiro.close();
}
loopMain();
