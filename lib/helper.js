'use strict';

// Core modules
let childProcess = require('child_process');
let fs           = require('fs');
let os           = require('os');
let path         = require('path');

// 3rd-party modules
let Bluebird = require('bluebird');
let winston  = require('winston');

// Misc
let exec = childProcess.exec;

let logger = new winston.Logger({
  transports: [ new winston.transports.File({ filename: 'gitify.log'}) ]
});

let helper = module.exports = {
  pExec: function (cmd, options) {
    options = options || {};

    return new Bluebird(function (resolve, reject) {
      exec(cmd, options, function (err, stdout, stderr) {
        if (stdout) {
          logger.info(stdout);
        }

        if (stderr) {
          logger.error(stderr);
        }

        if (err) {
          logger.error(err);
          return reject(err);
        }

        resolve();
      });
    });
  },

  ensureNpmShrinkwrapFile: function (yargs) {
    if (!fs.existsSync('./npm-shrinkwrap.json')) {
      console.log(yargs.help());
      console.log('');
      console.log('This command must be run in a directory with an npm-shrinkwrap.json file');

      process.exit(1);
    }
  },

  populateEnvironmentVariables: function (argv) {
    let defaultGitifyDir = path.resolve(os.homedir(), '.gitify');
    let nodeProjectsDir = process.env.NODE_PROJECTS_DIR || argv.nodeProjectsDir || defaultGitifyDir;

    process.env.NODE_PROJECTS_DIR = nodeProjectsDir;
    process.env.CHECKOUT_TAGS = process.env.CHECKOUT_TAGS || argv.checkoutTags || 'no';

    if (!(process.env.GITIFY_URL_PATTERN || argv.gitifyUrlPattern)) {
      throw new Error('No GITIFY_URL_PATTERN variable or --gitify-url-pattern option provided.');
    } else {
      process.env.GITIFY_URL_PATTERN = process.env.GITIFY_URL_PATTERN || argv.gitifyUrlPattern;
    }
  },

  git: {
    updateRepository: function (gitDir) {
      return helper.pExec('git --git-dir="' + gitDir + '/.git" fetch origin');
    },

    cloneRepository: function (url, destination) {
      return helper.pExec('git clone "' + url + '" "' + destination + '"');
    },

    checkoutRepository: function (gitDir, ref) {
      let execOptions = { cwd: gitDir };

      return helper.pExec('git fetch', execOptions)
        .then(() => helper.pExec('git checkout "' + ref + '"', execOptions));
    },

    createWorkDir: function (sharedRepoDir, depDir, depVersion) {
      let executablePath = __dirname + '/../bin/git-new-workdir.sh';

      return helper.pExec(
        executablePath + ' "' + sharedRepoDir + '" "' + depDir + '" ' + depVersion,
        { env: { 'PATH': process.env.PATH } }
      );
    }
  }
};
