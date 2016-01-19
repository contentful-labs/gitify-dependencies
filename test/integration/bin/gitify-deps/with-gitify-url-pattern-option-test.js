'use strict';

let execSync = require('child_process').execSync;
let expect = require('../../../helper').expect;
let fs = require('fs-extra');
let path = require('path');

const demoPath = path.resolve(__dirname, '..', '..', '..', 'fixtures', 'demo');
const modulesPath = path.resolve(demoPath, 'node_modules');
const cliPath = path.resolve(__dirname, '..', '..', '..', '..', 'bin', 'gitify-deps.js');
const changelogPath = `${modulesPath}/keepachangelog`;
const lodashPath = `${modulesPath}/lodash`;

describe('gitify-deps', function () {
  describe('with gitify-url-pattern option', function () {
    let output;

    // Since gitification is very slow we are only executing the CLI once before all
    // tests. Create another test file if you need different behavior.
    before(function () {
      let options = { cwd: demoPath };

      this.timeout(30000);
      fs.removeSync(modulesPath);

      output = execSync(`${cliPath} --gitify-url-pattern=contentful`, options).toString();
    });

    it('only gitifies a single dependency', function () {
      expect(output.match(/Replacing.*with git repository/g)).to.have.length(1);
    });

    it('replaces the keepachangelog dependency with a git repository', function () {
      expect(output).to.contain(`Replacing ${changelogPath} with git repository ...`);
    });

    it('transforms the plain node module directory into a git repository', function () {
      isGitRepository(changelogPath);
    });

    it('checks out the right git hash', function () {
      let hash = fs.readFileSync(`${changelogPath}/.git/HEAD`).toString().trim();

      expect(hash).to.equal('bb747260fcdad8e52f8a98e4dfa273869027a071');
    });

    it('does not touch the lodash dependency', function () {
      expect(output).to.not.contain('lodash');
    });

    it('does not transform lodash into a git repository', function () {
      isNoGitRepository(lodashPath);
    });
  });
});

function isGitRepository (path) {
  expect(function () {
    fs.statSync(`${path}/.git`);
  }).to.not.throw();
}

function isNoGitRepository (path) {
  expect(function () {
    fs.statSync(`${path}/lodash/.git`);
  }).to.throw(/no such file or directory/);
}
