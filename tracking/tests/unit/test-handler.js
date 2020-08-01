'use strict';

const app = require('../../app.js');
const chai = require('chai');
const expect = chai.expect;
const event, context;

describe('Test analytics', function () {
    it('verifies successful response', async () => {
        const result = await app.lambdaHandler(event, context)

        expect(result).to.be.an('object');
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.be.a('string');

        const response = JSON.parse(result.body);
        expect(response).to.be.an('object');
        expect(response.message).to.be.equal("{}");
    });
});
