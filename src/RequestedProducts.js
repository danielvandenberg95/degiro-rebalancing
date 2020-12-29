import './data_providers/data_provider.js';

/**
 * Class representation of the requested products. 
 * This includes positions and the percentage of the portfolio that should be in this product.
 */
class RequestedProducts{
	/**
	 * Creates the RequestedProducts storage.
	 * @param {DataProvider} dataProvider the DataProvider to use to store the requested products in.
	 */
	constructor(dataProvider){
		/**@member {DataProvider} dataProvider the DataProvider to use to store the requested products in. */
		this.dataProvider = dataProvider;
	}

	/**
	 * Closes the underlying dataProvider and saves the data.
	 */
	async close(){
		await this.save();
		await this.dataProvider.close();
	}

	/**
	 * Enriches the data with the current course information.
	 * @param {DeGiro} degiro The instance of DeGiro to use to enrich the data.
	 */
	async enrich(degiro){
		let productIds = this.positions.map(e => e.id);
		let positions = await degiro.getProductsByIds(productIds);
		this.positions.forEach(e=>{e.entry = positions[e.id]});
	}

	/**
	 * Opens the underlying dataProvider and loads the data.
	 * @async
	 */
	async open(){
		await this.dataProvider.open();
		this.positions = JSON.parse(await this.dataProvider.getData("requestedProducts") || "[]");
	}

	/** Saves the requested products to the underlying dataProvider. */
	async save(){
		let toSave = JSON.parse(JSON.stringify(this.positions));
		toSave.forEach(e=>{delete e.entry;});
		await this.dataProvider.setData("requestedProducts", JSON.stringify(toSave, null, 2));
	}
}

export default RequestedProducts;
