/**
 * Class representing a portfolio on DEGIRO.
 */
class Portfolio{
	/**
	 * Constructor.
	 * @param {array[]} deGiroData Data as retrieved from DeGiro.
	 */
	constructor(deGiroData){
		this.data = deGiroData;
	}

	/**
	 * Searches for a position in the portfolio by the given ID.
	 * @param {number} id 
	 * @returns {object} Position.
	 */
	findByID(id){
		return this.data.find(pf => pf.id === id);
	}

	/**
	 * Returns the total value of the portfolio. This excludes available balance.
	 * @returns {number} The value of the portfolio.
	 */
	getTotalValue() {
		return this.data
			.filter(e => e.entry.name != "EUR" && e.entry.isin != "LU1959429272"/*balance*/)
			.reduce((prev, cur) => prev + cur.value, 0) || 0;
	}
	
}
export default Portfolio;
