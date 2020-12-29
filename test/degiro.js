import assert from 'assert';
import DeGiro from '../src/degiro.js';
import Env from '../src/data_providers/env.js';

it.skip("DeGiro can login", ()=>{
	const deGiro = new DeGiro(new Env());
	it("Doesn't work before opening, but does afterwards.", async function(){
		assert.rejects(deGiro.getAccountConfig);
	});
	it("Can open", async function(){
		assert.doesNotReject(deGiro.open);
	});
	it("Can get account config after open", async function(){
		assert.doesNotReject(deGiro.getAccountConfig);
	});

	after(function(){
		deGiro.close();
	})
});
