#!/usr/bin/env node

'use strict';

/*
TODO:
  - Add app description: "gitifies" all dependencies whose repository.url matches PATTERN.
*/

let helper = require(__dirname + '/../lib/helper');
let gitify = require(__dirname + '/../lib/gitify');
let yargs = require('yargs')
  .option('checkout-tags', {
    alias: 'c',
    describe: 'If a dependency is already a git repo, "git checkout" ' +
      'the version specified in npm-shrinkwrap.json'
  })
  .option('gitify-url-pattern', {
    alias: 'p',
    describe: 'Specify a pattern that gets matched against the package\'s url.'
  })
  .option('node-projects-dir', {
    alias: 'd',
    describe: 'Set a path which will keep the git repository\'s data.'
  });

let argv = yargs.argv;

helper.populateEnvironmentVariables(argv);
helper.ensureNpmShrinkwrapFile(yargs);

gitify.gitifyAllDependencies().then(function () {
  process.exit(0);
}, function (err) {
  console.error(err);
  process.exit(1);
});
