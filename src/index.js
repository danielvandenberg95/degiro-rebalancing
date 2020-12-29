import CLI from './CLI.js';
import colors from 'colors/safe.js';
import Console from 'console';
import DeGiro from './degiro.js';
import LocalStorage from './data_providers/localstorage.js';
import pad from 'pad';
import StdIn from './data_providers/stdin.js';
import { toEur } from './Euro.js';

async function main() {
	let stdIn = new StdIn();
	let lsStorage = new LocalStorage();

	const degiro = new DeGiro(stdIn, lsStorage);
	await degiro.open();

	function getTotalValue(portfolio) {
		return portfolio
			.filter(e => e.entry.name != "EUR" && e.entry.isin != "LU1959429272"/*balance*/)
			.reduce((prev, cur) => prev + cur.value, 0) || Number.MIN_VALUE;
	}

	async function addPortfolioInfo(positions) {
		let portfolio = await degiro.getPortfolio();
		let totalValue = getTotalValue(portfolio);
		return positions.map(e => {
			let value = portfolio.find(pf => pf.id === e.id)?.value || 0;
			let valueFormatted = pad(8, Number(value).toFixed(2));
			let acutalPercentage = value / totalValue * 100;
			let percentageGoalFormatted = pad(6, Number(e.percentage || 0).toFixed(2));
			let percentageFormatted = pad(6, Number(acutalPercentage).toFixed(2));
			let percentageError = acutalPercentage - (e.percentage || 0);
			return {
				...e,
				value,
				valueFormatted,
				acutalPercentage,
				percentageFormatted,
				percentageGoalFormatted,
				percentageError,
				totalValue,
				refreshPercentages: function () {
					this.acutalPercentage = this.value / this.totalValue * 100;
					this.percentageGoalFormatted = pad(6, Number(this.percentage || 0).toFixed(2));
					this.percentageFormatted = pad(6, Number(this.acutalPercentage).toFixed(2));
					this.percentageError = this.acutalPercentage - (this.percentage || 0);
				}
			}
		})
	}

	async function getRequestedPositions(updated = false) {
		let ret = JSON.parse(await lsStorage.getData("requestedPositions") || "[]")
		if (!updated) {
			return ret;
		}
		let productIds = ret.map(e => e.id);
		let positions = await degiro.getProductsByIds(productIds);
		ret = ret.map(e => {
			return {
				entry: positions[e.id],
				...e
			}
		});
		return ret;
	}

	function setRequestedPositions(positions) {
		lsStorage.setData("requestedPositions", JSON.stringify(positions, null, 2));
	}

	function formatRequestedPosition(e) {
		return `${pad(4, e.productType || '')} - ${pad('IE00B579F325'.length, e.isin)} - ${e.name}`;
	}

	async function selectProduct(products) {
		Console.log(` 0 - cancel`);
		products.forEach((e, i) => {
			Console.log(`${pad(2, i + 1)} - ${formatRequestedPosition(e)}`);
		});
		let index = 1 * await stdIn.getData("Select position");
		let product = products[index - 1];
		if (index === 0 || !product) {
			return undefined;
		}
		return product;
	}

	let newConsole = new CLI(stdIn);
	newConsole
		.addHeaderLine(colors.red.bold("DEGIRO - rebalance help"))
		.addHeaderLine(async () => degiro.getBalanceString())
		.addFunction("Show positions", async () => {
			let portfolio = await degiro.getPortfolio();
			portfolio = portfolio.map(e => {
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
			portfolio = portfolio.map(e => { return { ...e, found: false }; });
			let totalValue = getTotalValue(portfolio);
			console.log(`${colors.blue(`Current total value: `)}€${Number(totalValue).toFixed(2)}`);

			let requestedPositions = (await getRequestedPositions());
			requestedPositions.forEach(e => {
				let pf = portfolio.find(pf => e.id === pf.id);
				if (pf) {
					pf.found = true;
				}
			});

			return (await addPortfolioInfo(requestedPositions
				.concat(portfolio.filter(e => !e.found).map(e => { return { e, ...e.entry }; }))))
				.map(e => {
					let percentageString = `${e.percentageFormatted}% / ${e.percentageGoalFormatted}%`;
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
				.map(e => `€${e.valueFormatted} - ${e.percentageString} - ${formatRequestedPosition(e)}`)
		})
		.addFunction("Show recommendation (buy only)", async () => {
			console.log(await degiro.getBalanceString());
			let requestedPositions = (await addPortfolioInfo(await getRequestedPositions(true)))
				.map(e => { return { ...e, buyPrice: e.entry.closePrice } });//TODO: Make current price.
			let balance = await degiro.getBalance();
			let requestedPositionsCopy = requestedPositions;
			let buy = {};
			while (requestedPositions = requestedPositions.filter(e => e.buyPrice < balance),
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
			buy.map(e => `Buy ${colors.green(pad(3, e.count))} x ${colors.blue(e.isin)} at a price of ${colors.green(toEur(e.buyPrice))} for a final value of ${colors.green(toEur(e.endValue))} - ${colors.blue(e.name)}`)
				.forEach(e => { console.log(e); });
		});

	newConsole
		.addSubMenu("Manage requested positions")
		.addHeaderLine(colors.red.bold("DEGIRO - rebalance help - manage requested positions"))
		.addHeaderLine(async () => {
			return (await getRequestedPositions())
				.map(e => `${pad(5, Number(e.percentage).toFixed(2))}% - ${formatRequestedPosition(e)}`);
		})
		.addFunction("Set percentage", async () => {
			let products = (await getRequestedPositions());
			let product = await selectProduct(products);
			if (!product) {
				return "Cancelled.";
			}
			product.percentage = 1 * await stdIn.getData("Percentage");
			setRequestedPositions(products);
		})
		.addFunction("Add position", async () => {
			let text = await stdIn.getData("Search for position");
			let products = await degiro.searchProduct({ text });
			let product = await selectProduct(products);
			if (!product) {
				return "Cancelled.";
			}
			product.percentage = 0;
			let positions = (await getRequestedPositions());
			positions.push(product)
			setRequestedPositions(positions);
		})
		.addFunction("Remove position", async () => {
			let products = await getRequestedPositions();
			let product = await selectProduct(products);
			if (!product) {
				return "Cancelled.";
			}
			setRequestedPositions(products.filter(e => e != product));
		});

	await newConsole.loop();

	degiro.close();
}
main();
