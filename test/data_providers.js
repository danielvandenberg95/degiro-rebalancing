import assert from 'assert';
import Env from '../src/data_providers/env.js';
import LocalStorage from '../src/data_providers/localstorage.js';
import MockProvider from '../src/data_providers/mockprovider.js';
import StdIn from '../src/data_providers/stdin.js';
import util from 'util';

let dataProviderTypes = [StdIn, LocalStorage, MockProvider, Env];

dataProviderTypes.forEach((dataProviderType) => {
	describe(dataProviderType.name, () => {
		let dataProvider = new dataProviderType();

		let hasFunction = (functionName)=>{
			it(`Should contain ${functionName}`, () => {
				assert.strictEqual(typeof (dataProvider[functionName]), "function");
			});
			it(`${functionName} is async`, () => {
				assert.ok(util.types.isAsyncFunction(dataProvider[functionName]), "function");
			});
		}

		describe("has_functions", () => {
			["open", "close", "getData"].forEach(hasFunction);
		});


		let getFunctionOpenTest = (functionName, hasToExist) => {
			describe(functionName, () => {
				let isExisting = typeof(dataProvider[functionName]) == "function";
				it(hasToExist ? `Must exist` : `May exist`, ()=>{
					assert.ok(isExisting || !hasToExist);
				});
				if (!isExisting){
					return;
				}
				it(`Should reject if not open`, () => {
					assert.rejects(dataProvider[functionName].bind("test"));
				});
				dataProvider.open();
				it("Should not reject after openend", () => {
					assert.doesNotThrow(dataProvider[functionName].bind("test"));
				});
				dataProvider.close();
				it(`Should reject after close`, () => {
					assert.rejects(dataProvider[functionName].bind("test"));
				});
			})
		};
		getFunctionOpenTest("getData", true);
		getFunctionOpenTest("getDataSecure", false);

		describe("if setter, getter is mirror of setter", () => {
			if (typeof (dataProvider["setData"]) != "function") {
				it("No set available.", () => {
					assert.ok(true);
				});
				return;
			}
			it("After set, get returns the set value.", async () => {
				await dataProvider.open();
				await dataProvider.setData("testData", "mytest");
				let ret = await dataProvider.getData("testData");
				dataProvider.close();
				assert.strictEqual(ret, "mytest");
			});
		});
	});
});
