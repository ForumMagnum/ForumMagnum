#!/bin/bash

# Configuration - Change this to your desired target branch
TARGET_BRANCH="master"

echo "=== Vercel Build Step Check ==="
echo "Checking if build should proceed..."
echo ""

if [ "$VERCEL_ENV" == "production" ]; then
  echo "✅ Production deploy hook - Build will proceed"
  exit 1
fi

# Check if this is a pull request deployment
if [ -z "$VERCEL_GIT_PULL_REQUEST_ID" ]; then
  # Check if branch name contains "preview" or "cursor/"
  if [[ "$VERCEL_GIT_COMMIT_REF" == *"preview"* ]] || [[ "$VERCEL_GIT_COMMIT_REF" == *"cursor/"* ]]; then
    echo "✓ Branch name contains 'preview' or 'cursor/' - Build will proceed"
    echo "✓ Branch: $VERCEL_GIT_COMMIT_REF"
    exit 1
  fi
  # Check if commit message contains "preview" (case-insensitive)
  COMMIT_MSG_LOWER=$(echo "$VERCEL_GIT_COMMIT_MESSAGE" | tr '[:upper:]' '[:lower:]')
  if [[ "$COMMIT_MSG_LOWER" == *"preview"* ]]; then
    echo "✓ Commit message contains 'preview' - Build will proceed"
    echo "✓ Commit message: $VERCEL_GIT_COMMIT_MESSAGE"
    exit 1
  fi
  echo "🛑 Not a pull request deployment and branch name/commit message doesn't match preview pattern - Build cancelled"
  exit 0
fi

echo "✓ Pull request deployment detected (PR #$VERCEL_GIT_PULL_REQUEST_ID)"

# Verify required environment variables are available
if [ -z "$VERCEL_GIT_REPO_OWNER" ] || [ -z "$VERCEL_GIT_REPO_SLUG" ]; then
  echo "❌ Error: Required Git environment variables not found"
  echo "Make sure 'Automatically expose System Environment Variables' is enabled in project settings"
  exit 0
fi

# Construct GitHub API URL
API_URL="https://api.github.com/repos/$VERCEL_GIT_REPO_OWNER/$VERCEL_GIT_REPO_SLUG/pulls/$VERCEL_GIT_PULL_REQUEST_ID"
echo "Fetching PR details from: $API_URL"

# Create a temporary file for the API response
TMP_FILE=$(mktemp)
trap "rm -f $TMP_FILE" EXIT

# Fetch PR details from GitHub API
# If GITHUB_TOKEN is available (set in Vercel env vars), use it for higher rate limits
if [ -n "$GITHUB_TOKEN" ]; then
  curl -s -H "Authorization: token $GITHUB_TOKEN" "$API_URL" > "$TMP_FILE"
else
  echo "⚠️  Warning: GITHUB_TOKEN not set - using unauthenticated requests (lower rate limit)"
  curl -s "$API_URL" > "$TMP_FILE"
fi

# Check if API request was successful and extract the base branch using Node.js
PARSE_RESULT=$(node -e "
const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('$TMP_FILE', 'utf8'));
  if (data.message) {
    console.log('ERROR:' + data.message);
  } else if (data.base && data.base.ref) {
    console.log('SUCCESS:' + data.base.ref);
  } else {
    console.log('ERROR:Invalid JSON structure - missing base.ref');
  }
} catch (e) {
  console.log('ERROR:Failed to parse JSON - ' + e.message);
}
")

# Parse the result
if [[ "$PARSE_RESULT" == ERROR:* ]]; then
  ERROR_MSG="${PARSE_RESULT#ERROR:}"
  echo "❌ Error: $ERROR_MSG"
  exit 0
fi

BASE_BRANCH="${PARSE_RESULT#SUCCESS:}"

if [ -z "$BASE_BRANCH" ]; then
  echo "❌ Error: Could not determine target branch from API response"
  exit 0
fi

echo "✓ PR target branch: $BASE_BRANCH"
echo "✓ Required target branch: $TARGET_BRANCH"
echo ""

# Check if the target branch matches
if [ "$BASE_BRANCH" = "$TARGET_BRANCH" ]; then
  echo "✅ Target branch matches! Build will proceed"
  exit 1
else
  echo "🛑 Target branch does not match - Build cancelled"
  exit 0
fi
