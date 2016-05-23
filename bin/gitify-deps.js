#!/usr/bin/env node

'use strict';

/*
TODO:
  - Add app description: "gitifies" all dependencies whose repository.url matches PATTERN.
*/

let Bluebird = require('bluebird');
let helper = require(__dirname + '/../lib/helper');
let gitify = require(__dirname + '/../lib/gitify');
let yargs = require('yargs');
let app = yargs
  .option('checkout-tags', {
    alias: 'c',
    describe: 'If a dependency is already a git repo, "git checkout" ' +
      'the version specified in npm-shrinkwrap.json',
    type: 'string'
  })
  .option('gitify-url-pattern', {
    alias: 'p',
    describe: 'Specify a pattern that gets matched against the package\'s url.',
    type: 'string'
  })
  .option('node-projects-dir', {
    alias: 'd',
    describe: 'Set a path which will keep the git repository\'s data.',
    type: 'string'
  })
  .help('help')
  .detectLocale(false)
  .wrap(Math.min(yargs.terminalWidth(), 120));

let argv = app.argv;

Bluebird.resolve().then(function () {
  return helper.populateEnvironmentVariables(argv);
}).then(function () {
  return helper.ensureNpmShrinkwrapFile(yargs);
}).then(function () {
  return gitify.gitifyAllDependencies();
}).then(function () {
  process.exit(0);
}, function (err) {
  console.error('\ngitify-deps\n');
  console.error(
    'Converts all dependencies whose repository.url matches PATTERN into its respective ' +
    'git repository representation.\n'
  );
  console.error(app.help());
  console.error(err.message);
  process.exit(1);
});
