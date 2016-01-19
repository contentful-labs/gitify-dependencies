'use strict';

// Core modules
let fs          = require('fs-extra');
let os          = require('os');
let resolvePath = require('path').resolve;

// 3rd-party modules
let _        = require('lodash');
let Bluebird = require('bluebird');
let dottie   = require('dottie');

// Local modules
let helper = require('./helper');

module.exports = {
  gitifyAllDependencies: () => {
    let pwd = process.cwd();

    return maybeInstallNodeModules()
      .then(_.partial(processDependencies, pwd, pwd + '/npm-shrinkwrap.json'));
  }
};

/*
  Install the node modules if they aren't installed yet.

  TODO:
  it('installs dependencies if no node_modules dir is available');
  it('exists when npm install fails');
  Can we use Bluebird.promisify(fs.exists) ?
*/
function maybeInstallNodeModules () {
  return isDirectory('./node_modules').then(function (isDirectory) {
    if (!isDirectory) {
      process.stdout.write('- Installing all dependencies ... ');

      return helper
        .pExec('npm --silent install')
        .then(function () {
          console.log('done');
        }, function (err) {
          console.error('failed');
          throw err;
        });
    }
  });
}

function processDependencies (dir, shrinkwrapFile, shrinkwrapPath) {
  let shrinkwrapContent = require(shrinkwrapFile);
  let dependenciesPath  = _.compact(_.flatten([shrinkwrapPath].concat('dependencies')));
  let dependencies      = dottie.get(shrinkwrapContent, dependenciesPath);
  let depNames          = Object.keys(dependencies || {});

  return Bluebird.mapSeries(depNames, function (depName) {
    let depDir            = dir + '/node_modules/' + depName;
    let depShrinkwrapPath = dependenciesPath.concat(depName);

    return processDependency(depDir, shrinkwrapFile, depShrinkwrapPath, depName);
  });
}

function processDependency (depDir, shrinkwrapFile, depShrinkwrapPath, depName) {
  let depGitDir         = depDir + '/.git';
  let shrinkwrapContent = require(shrinkwrapFile);
  let versionPath       = depShrinkwrapPath.concat('version');
  let depVersion        = 'v' + dottie.get(shrinkwrapContent, versionPath);

  return Bluebird.all([
    isDirectory(depDir),
    isDirectory(depGitDir)
  ]).spread(function (depDirExists, depGitDirExists) {
    if (!depDirExists) {
      return processDepDir(shrinkwrapFile, depShrinkwrapPath, depDir, depName, depVersion);
    } else if (!depGitDirExists) {
      return gitifyDependency(depDir, depName, depVersion);
    } else if (process.env.CHECKOUT_TAGS === 'yes') {
      return checkoutTags(depDir, depVersion);
    }
  }).then(function () {
    return processDependencies(depDir, shrinkwrapFile, depShrinkwrapPath);
  });
}

function checkoutTags (depDir, depVersion) {
  process.stdout.write('- Replacing ' + depDir + ' with git tag ...');

  return helper.git.checkoutRepository(depDir, depVersion).then(function () {
    console.log('done');
  }, function (err) {
    console.log('failed');
    throw err;
  });
}

function processDepDir (shrinkwrapFile, depShrinkwrapPath, depDir, depName, depVersion) {
  let shrinkwrapContent = require(shrinkwrapFile);
  let resolved = dottie.get(
    shrinkwrapContent, depShrinkwrapPath.concat('resolved'), depName + '@' + depVersion
  );

  return installDependency(resolvePath(depDir, '..', '..'), resolved)
    .then(() => processDependency(depDir, shrinkwrapFile, depShrinkwrapPath, depName));
}

function gitifyDependency (depDir, depName, depVersion) {
  let remoteUrl     = getRemoteUrl(depDir);
  let sharedRepoDir = process.env.NODE_PROJECTS_DIR + '/' + depName;

  if (isRelevantDependencyUrl(remoteUrl)) {
    console.log('- Replacing ' + depDir + ' with git repository ...');

    return replacePackageWithGitRepository(sharedRepoDir, depDir, depName, remoteUrl)
      .then(function () {
        return replaceWithGitWorkDir(sharedRepoDir, depDir, depVersion);
      });
  }
}

function isDirectory (path) {
  return new Bluebird(function (resolve) {
    fs.lstat(path, function (err, stats) {
      resolve(!err && stats.isDirectory());
    });
  });
}

function installDependency (path, dep) {
  return helper.pExec('npm --silent install "' + dep + '"  >/dev/null 2>&1', { cwd: path });
}

function getRemoteUrl (dir) {
  let packageContent = require(dir + '/package.json');
  let packageUrl     = dottie.get(packageContent, 'repository.url');

  if (packageUrl) {
    return packageUrl.replace('git://github.com', 'git+ssh://git@github.com');
  }
}

function isRelevantDependencyUrl (url) {
  return url && url.match(process.env.GITIFY_URL_PATTERN);
}

function replacePackageWithGitRepository (sharedRepoDir, depDir, depName, remoteUrl) {
  return isDirectory(sharedRepoDir).then(function (isDirectory) {
    if (isDirectory) {
      process.stdout.write('  -> Updating existing git repository ... ');
      return helper.git.updateRepository(sharedRepoDir);
    } else {
      process.stdout.write('  -> Cloning git repository ... ');
      return helper.git.cloneRepository(remoteUrl, sharedRepoDir);
    }
  }).then(function () {
    console.log('done');
  }, function (err) {
    console.log('failed');
    throw err;
  });
}

function replaceWithGitWorkDir (sharedRepoDir, depDir, depVersion) {
  let backupDir = os.tmpdir() + '/gitify-' + ~~(Math.random() * 9999);

  return backupNodeModules(depDir, backupDir).then(function () {
    fs.removeSync(depDir);

    return createGitWorkDir(sharedRepoDir, depDir, depVersion).then(function () {
      return restoreNodeModules(depDir, backupDir);
    });
  });
}
function createGitWorkDir (sharedRepoDir, depDir, depVersion) {
  process.stdout.write('  -> Creating new git working dir ... ');

  return helper.git.createWorkDir(sharedRepoDir, depDir, depVersion).then(function () {
    console.log('done');
  }, function (err) {
    console.log('failed');
    throw err;
  });
}

function backupNodeModules (depDir, backupDir) {
  let nodeModulesDir = depDir + '/node_modules';

  return moveNodeModules(
    nodeModulesDir, backupDir, 'Creating backup of installed dependencies'
  );
}

function restoreNodeModules (depDir, backupDir) {
  let nodeModulesDir = depDir + '/node_modules';

  return moveNodeModules(
    backupDir, nodeModulesDir, 'Restoring backup of installed dependencies'
  );
}

function moveNodeModules (src, dest, message) {
  debug('Moving node_modules from', src, dest);

  process.stdout.write('  -> ' + message + ' ... ');

  return new Bluebird(function (resolve, reject) {
    return isDirectory(src).then(function (isDirectory) {
      if (!isDirectory) {
        resolve();
      }

      fs.move(src, dest, function (err) {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  }).then(function () {
    console.log('done');
  }, function (err) {
    console.log('failed');
    throw err;
  });
}

function debug () {
  if (process.env.DEBUG) {
    console.log.apply(console, arguments);
  }
}
