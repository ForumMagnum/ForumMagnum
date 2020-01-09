#!/bin/bash
# Measure the amount of javascript on the page, using a local server running on
# port 3000. (This will typically be debug-mode, which is bloatier than
# production mode because it isn't minified.) Leaves the javascript behind in
# tmp/bundleSizeDownloads for further inspection.

mkdir -p tmp
local_frontpage_url=http://localhost:3000
user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"

# Load the front page
if ! curl --silent --show-error --user-agent "$user_agent" -o tmp/localFrontPage $local_frontpage_url; then
  echo "Failed to download $local_frontpage_url; is a server running?"
  exit 1
fi

# Extract a list of Javascript files referenced from the front page
cat tmp/localFrontPage \
  |egrep --only-matching -e '<script\s*(type=".*")?\s*src="[^"]*">' \
  |sed -e 's/.*src="\([^"]*\)".*/\1/'  \
  >tmp/scriptFilenames

# Download those files
rm -rf tmp/bundleSizeDownloads
mkdir -p tmp/bundleSizeDownloads
for scripturl in $(cat tmp/scriptFilenames); do
  scripturl_noslashes_nohash=$(echo "$scripturl" |sed -e 's/\//_/g' |sed -e 's/?hash=[a-z0-9]*//')
  curl --silent --show-error --user-agent "$user_agent" -o "tmp/bundleSizeDownloads/${scripturl_noslashes_nohash}" "http://localhost:3000$scripturl"
done

# Show total sizes
echo "Uncompressed, unminified script sizes:"
find tmp/bundleSizeDownloads -type f |xargs wc -c

echo "Compressed, unminified script sizes:"
tar zcf tmp/compressedScripts.tgz tmp/bundleSizeDownloads
wc -c tmp/compressedScripts.tgz

