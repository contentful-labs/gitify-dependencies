# gitify-dependencies [![Build Status](https://travis-ci.com/contentful/gitify-dependencies.svg?token=CYEWg3reo6fMQ47zH5gY&branch=master)](https://travis-ci.com/contentful/gitify-dependencies)
CLI tool for replacing node dependencies with their respective git repositories.

## Installation

```
npm install -g contentful/gitify-dependencies.git
```

## Usage

```
gitify-deps [--options]
```

### Options

#### --checkout-tags, -c

If a dependency is already a git repo, the CLI will just "git checkout" the version specified in npm-shrinkwrap.json.
This option can also be set via the environment variable `CHECKOUT_TAGS`.

Allowed values: ['yes', 'no']  
Default value: 'no'

#### --gitify-url-pattern, -p

Specify a pattern that gets matched against the package's url. 
This option can also be set via the environment variable `GITIFY_URL_PATTERN`.

*Please note, that you must either set this flag or the environment variable!*

#### NODE_PROJECTS_DIR

Use this environment variable to set a path which will keep the git repository's data. 

Default value: `$HOME/.gitify`

## Idea

This tool walks through your `npm-shrinkwrap.json` file and does the following things for every dependency (and it's sub-dependencies):

1. Clone or update the package's repo in `{NODE_PROJECTS_DIR}/{name of the dependency}`. 
2. Back up the package's private `node_modules` directory if present.
3. Remove any existing package.
4. Create a new git "workdir" in it's place that shares the same repository as `{NODE_PROJECTS_DIR}/{name of the dependency}`.
5. Restore the package's private `node_modules`.

In practice you can treat this like a sort of "linked clone" of the original repo. Objects and refs (branches and tags) will be shared between all workdirs, but each one will have it's own working tree, HEAD, and index (staging area). One caveat is that only the git repository is synced, making changes and commiting in one workdir doesn't affect the files in another workdir. Use feature branches

More information about workdirs:

 - [Nice explanation of git-new-workdir](http://nuclearsquid.com/writings/git-new-workdir/)
 - [The original script from git/git/contrib](https://github.com/git/git/blob/7b69fcb181941fafda99a5ffd25cea1f685d7e70/contrib/workdir/git-new-workdir)
