#!/bin/bash
# Check presence and versions of outside-of-node dependencies, including the
# version of node itself. In the future this may be a postinstall script
# run from package.json.

echo -n "Checking for node... "
if which node >/dev/null; then
  NODE_VERSION=$(node --version 2>&1)
  echo "$NODE_VERSION"
else
  echo "not found"
  echo "Install node.js 14 or later to continue. https://nodejs.org/"
  exit 1
fi

echo -n "Checking for yarn... "
if which yarn >/dev/null; then
  yarn --version
else
  echo not found
  echo "Install yarn.js to continue. https://yarnpkg.com/getting-started/install"
fi

echo -n "Checking for mongodb... "
if which mongod >/dev/null; then
  mongod --version |head -1 >/dev/null
else
  echo "not found"
  echo '`mongod` is not installed. You can run LessWrong by connecting to a remote'
  echo 'database, but you probably want a local server for testing.'
  echo "See https://docs.mongodb.com/manual/installation/"
  echo
fi

# Check for an acceptable version of `ln`. Linux has an acceptable version of
# ln by default; MacOS doesn't, it needs the GNU version from brew. The scripts
# we use for switching between meteor and express versions rely on a few flags
# that MacOS lacks.
echo -n "Checking for a working ln... "
if ln --version >/dev/null 2>/dev/null ; then
  echo "yes"
else
  echo "no"
  echo "You are using MacOS coreutils that lack some required options. To get a suitable"
  echo "version, first install Homebrew (https://brew.sh/) then run:"
  echo "  brew install coreutils"
  echo
fi

echo -n "Checking for curl... "
if which curl >/dev/null; then
  echo "yes"
else
  echo "no"
  echo "You do not have curl installed. The server will still run, but some associated"
  echo "scripts and unit tests will fail."
  echo
fi


