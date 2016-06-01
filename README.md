# gitify-dependencies [![Build Status](https://api.travis-ci.org/contentful-labs/gitify-dependencies.svg?branch=master)](https://travis-ci.org/contentful-labs/gitify-dependencies)
CLI tool for replacing node dependencies with their respective git repositories.

## Installation

```
npm install -g gitify-dependencies
```

## Usage

```
gitify-deps [--options]
```

### Options

| Flag | Environment variable | Description | Allowed values | Default value |
|------|----------------------|-------------|----------------|---------------|
| --checkout-tags<br>-c | CHECKOUT_TAGS | If a dependency is already a git repo, the CLI will just "git checkout" the version specified in `npm-shrinkwrap.json`. | 'yes', 'no' | 'no' |
| --gitify-url-pattern<br>-p | GITIFY_URL_PATTERN | Specify a pattern that gets matched against the package's url.<br> **Please note, that you must either set this flag or the environment variable!** | none | none |
| --node-projects-dir<br> -d | NODE_PROJECTS_DIR | Set a path which will keep the git repository's data. | none | $HOME/.gitify |

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
