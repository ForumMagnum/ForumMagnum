#!/bin/bash

# Configuration - Change this to your desired target branch
TARGET_BRANCH="nextjs-with-suspense-branch"

echo "=== Vercel Build Step Check ==="
echo "Checking if build should proceed..."
echo ""

# Check if this is a pull request deployment
if [ -z "$VERCEL_GIT_PULL_REQUEST_ID" ]; then
  echo "🛑 Not a pull request deployment - Build cancelled"
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

# Fetch PR details from GitHub API
# If GITHUB_TOKEN is available (set in Vercel env vars), use it for higher rate limits
if [ -n "$GITHUB_TOKEN" ]; then
  PR_DATA=$(curl -s -H "Authorization: token $GITHUB_TOKEN" "$API_URL")
else
  echo "⚠️  Warning: GITHUB_TOKEN not set - using unauthenticated requests (lower rate limit)"
  PR_DATA=$(curl -s "$API_URL")
fi

# Check if API request was successful
if echo "$PR_DATA" | grep -q '"message": "Not Found"'; then
  echo "❌ Error: Could not fetch PR details (PR not found)"
  exit 0
fi

# Extract the base (target) branch from the JSON response
BASE_BRANCH=$(echo "$PR_DATA" | grep -o '"base":[^}]*"ref":"[^"]*"' | grep -o '"ref":"[^"]*"' | cut -d'"' -f4)

if [ -z "$BASE_BRANCH" ]; then
  echo "❌ Error: Could not determine target branch from API response"
  echo "API Response: $PR_DATA"
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
