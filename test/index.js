const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const sinon = require("sinon");

// Index is loaded so that babel-polyfill has a chance to get going
require("../dist/index.js");

const { expect } = chai;

chai.use(chaiAsPromised);

Object.assign(global, {
    expect,
    sinon
});
