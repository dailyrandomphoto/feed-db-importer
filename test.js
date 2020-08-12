'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const { expect } = chai;
const main = require('.');

describe('feed-db-importer', () => {
  it('module should to be a function', () => {
    expect(main).to.be.a('function');
  });

  it('should throw an error', () => {
    return expect(main()).to.be.rejected;
  });

  it('should throw an error', () => {
    return expect(main('test.js')).to.be.rejected;
  });
});
