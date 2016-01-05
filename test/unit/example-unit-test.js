/*
This is an example unit test.
It should contain tests about isolated units.
*/

'use strict';

var expect = require('../helper').expect;

describe('Example unit', function () {
  beforeEach(function () {
    // Do something here before each test
  });

  describe('Example method', function () {
    it('works', function () {
      // Either return a promise or make a synchronous test
      // The available expectations can be found here:
      // http://chaijs.com/api/bdd/
      expect(1).to.equal(1);
    });
  });
});
