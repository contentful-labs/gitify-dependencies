'use strict';

let _ = require('lodash');
let execSync = require('child_process').execSync;
let expect = require('../../../helper').expect;
let fs = require('fs-extra');
let path = require('path');
let os = require('os');

const demoPath = path.resolve(__dirname, '..', '..', '..', 'fixtures', 'demo');
const modulesPath = path.resolve(demoPath, 'node_modules');
const cliPath = path.resolve(__dirname, '..', '..', '..', '..', 'bin', 'gitify-deps.js');
const changelogPath = `${modulesPath}/keepachangelog`;
const lodashPath = `${modulesPath}/lodash`;

describe('gitify-deps', function () {
  describe('with NODE_PROJECTS_DIR', function () {
    let output;

    // Since gitification is very slow we are only executing the CLI once before all
    // tests. Create another test file if you need different behavior.
    before(function () {
      let options = {
        env: env({
          NODE_PROJECTS_DIR: os.tmpdir() + '/.gitify',
          GITIFY_URL_PATTERN: 'contentful'
        }),
        cwd: demoPath
      };

      this.timeout(30000);
      fs.removeSync(modulesPath);

      output = execSync(cliPath, options).toString();
    });

    it('creates the gitified repositories in /tmp/.gitify', function () {
      isGitRepository(os.tmpdir() + '/.gitify/keepachangelog');
    });
  });

  describe('with --node-projects-dir', function () {
    let output;

    // Since gitification is very slow we are only executing the CLI once before all
    // tests. Create another test file if you need different behavior.
    before(function () {
      let cmd = `${cliPath} --node-projects-dir=${os.tmpdir() + '/.gitify'}`;
      let options = {
        env: env({ GITIFY_URL_PATTERN: 'contentful' }),
        cwd: demoPath
      };

      this.timeout(30000);
      fs.removeSync(modulesPath);

      output = execSync(cmd, options).toString();
    });

    it('creates the gitified repositories in /tmp/.gitify', function () {
      isGitRepository(os.tmpdir() + '/.gitify/keepachangelog');
    });
  });

  describe('with default NODE_PROJECTS_DIR', function () {
    let output;

    // Since gitification is very slow we are only executing the CLI once before all
    // tests. Create another test file if you need different behavior.
    before(function () {
      let options = {
        env: env({ GITIFY_URL_PATTERN: 'contentful' }),
        cwd: demoPath
      };

      this.timeout(30000);
      fs.removeSync(modulesPath);

      output = execSync(cliPath, options).toString();
    });

    it('creates the gitified repositories in $HOME/.gitify', function () {
      isGitRepository(os.homedir() + '/.gitify/keepachangelog');
    });
  });
});

function env (args) {
  return _.extend(args, process.env);
}

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
