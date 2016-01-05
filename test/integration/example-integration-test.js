/*
This is an example integration test.
It should contain tests about complex logic that relates to a lot of components.
*/

'use strict';

var expect = require('../helper').expect;

describe('Example integration test', function () {
  beforeEach(function () {
    // Do something here before each test
  });

  afterEach(function () {
    // Do something here after each test
  });

  describe('Example scenario', function () {
    it('behaves correctly', function () {
      // Either return a promise or make a synchronous test
      // The available expectations can be found here:
      // http://chaijs.com/api/bdd/
      expect(1).to.equal(1);
    });
  });
});
