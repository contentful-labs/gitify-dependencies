'use strict';

let execSync = require('child_process').execSync;
let expect = require('../../../helper').expect;
let path = require('path');

const cliPath = path.resolve(__dirname, '..', '..', '..', '..', 'bin', 'gitify-deps.js');

describe('gitify-deps', function () {
  describe('without GITIFY_URL_PATTERN', function () {
    it('complains about missing url pattern vars', function () {
      expect(function () {
        execSync(cliPath);
      }).to.throw(/No GITIFY_URL_PATTERN option defined\./);
    });
  });
});
