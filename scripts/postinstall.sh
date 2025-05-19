#!/usr/bin/env bash
# Check presence and versions of outside-of-node dependencies, including the
# version of nodejs, and warn about system issues that would cause problems.
# This is run as a postinstall script from package.json.

REQUIRED_NODE_MAJOR_VERSION=22

echo -n "Checking for node... "
if which node >/dev/null; then
  node --version 2>&1
  NODE_MAJOR_VERSION=$(node -p 'process.version.match(/^v(\d+)/)[1]')
  if [ "$NODE_MAJOR_VERSION" -lt "$REQUIRED_NODE_MAJOR_VERSION" ]; then
    echo "Your version of nodejs is too old (we require 22.x). You might want to use Node"
    echo "Version Manager (nvm). For install instructions, see"
    echo "    https://github.com/nvm-sh/nvm#installing-and-updating"
    echo "And then run:"
    echo "    nvm install $REQUIRED_NODE_MAJOR_VERSION; nvm use $REQUIRED_NODE_MAJOR_VERSION"
    exit 1
  elif [ "$NODE_MAJOR_VERSION" -gt "$REQUIRED_NODE_MAJOR_VERSION" ]; then
    echo "Your version of nodejs is a newer major version than we use (we use 22.x); you"
    echo "may encounter compatibility issues. To switch to node ${REQUIRED_NODE_MAJOR_VERSION}, use"
    echo "    nvm install $REQUIRED_NODE_MAJOR_VERSION; nvm use $REQUIRED_NODE_MAJOR_VERSION"
    echo "If you don't have nvm installed, see:"
    echo "    https://github.com/nvm-sh/nvm#installing-and-updating"
  fi
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
  exit 1
fi

if [ "$NODE_ENV" == "production" ]; then
  echo "production run, skipping unnecessary checks"
  exit 0
fi

echo -n "Checking for postgres... "
if which psql >/dev/null; then
  echo "yes"
else
  echo "not found"
  echo '`psql` is not installed. You can run ForumMagnum by connecting to a remote'
  echo 'database, but you probably want a local server for testing.'
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

echo -n "Checking for perl... "
if which perl >/dev/null; then
  echo "yes"
else
  echo "no"
  echo "You do not have perl installed. The server will still run, you will not be able"
  echo "to run makemigrations"
  echo
fi

if [ ! -f settings-dev.json ]; then
  echo "Creating settings-dev.json"
  cp sample_settings.json settings-dev.json
fi

echo -n "Checking system file-watchers limit... "
# Check that the sysctl setting exists (it does on Linux, but not MacOS)
if [ -e /proc/sys/fs/inotify/max_user_watches ]; then
  MAX_WATCHES="$(cat /proc/sys/fs/inotify/max_user_watches)"
  echo "$MAX_WATCHES"
  if [ "$MAX_WATCHES" -lt 32768 ]; then
    echo "For automatic rebuilds to work, you may need to increase the system maximum number"
    echo "of files watched for changes. You can do this temporarily (until next reboot) with:"
    echo "    sudo sysctl -w fs.inotify.max_user_watches=100000"
    echo "and make this permanent with:"
    echo "    sudo bash -c 'echo "fs.inotify.max_user_watches=100000" >>/etc/sysctl.d/10-user-watches.conf'"
  fi
else
  echo 'N/A'
fi

#echo 'Running yarn install in ckEditor/'
#(cd ckEditor && yarn install)
echo 'For development, you might need to run (cd ckEditor && yarn install)'

