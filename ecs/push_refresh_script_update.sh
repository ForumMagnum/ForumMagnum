#!/usr/bin/env bash
set -euo pipefail

# ------------------------------------------------------------
# Build & push dev-refresh image to ECR as :latest (and optional :vYYYYmmdd-HHMMSS)
# - Forces linux/amd64 to avoid M1/ARM runtime mismatches on Fargate x86_64
# - Uses an ephemeral buildx builder and restores previous builder afterward
# - Requires: aws cli, docker, docker buildx
# ------------------------------------------------------------

# --- Config (override with env vars or flags) ---
REGION="${REGION:-us-east-1}"
REPO_NAME="${REPO_NAME:-dev-refresh}"           # ECR repository name
IMAGE_TAG="${IMAGE_TAG:-latest}"                # default tag to push (task def should point to this)
PUSH_VERSION_TAG="${PUSH_VERSION_TAG:-false}"   # true/false to also push a versioned tag
CONTEXT_DIR="${CONTEXT_DIR:-.}"                 # docker build context (default current dir)
DOCKERFILE="${DOCKERFILE:-Dockerfile}"          # Dockerfile path
PLATFORMS="${PLATFORMS:-linux/amd64}"           # you can set linux/amd64,linux/arm64 to push multi-arch
NO_CACHE="${NO_CACHE:-true}"                    # build with --no-cache by default

# --- Flags parsing (optional) ---
usage() {
  cat <<EOF
Usage: $(basename "$0") [--region us-east-1] [--repo dev-refresh] [--tag latest]
                       [--with-version-tag] [--context .] [--dockerfile Dockerfile]
                       [--platforms linux/amd64] [--no-cache=false]

Examples:
  $(basename "$0") --with-version-tag
  REGION=us-east-1 REPO_NAME=dev-refresh $(basename "$0") --platforms linux/amd64,linux/arm64
EOF
}
while [[ $# -gt 0 ]]; do
  case "$1" in
    --region) REGION="$2"; shift 2;;
    --repo|--repository) REPO_NAME="$2"; shift 2;;
    --tag) IMAGE_TAG="$2"; shift 2;;
    --with-version-tag) PUSH_VERSION_TAG=true; shift 1;;
    --context) CONTEXT_DIR="$2"; shift 2;;
    --dockerfile) DOCKERFILE="$2"; shift 2;;
    --platforms) PLATFORMS="$2"; shift 2;;
    --no-cache) NO_CACHE="$2"; shift 2;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 1;;
  esac
done

echo "Region:          $REGION"
echo "Repository:      $REPO_NAME"
echo "Tag:             $IMAGE_TAG"
echo "Platforms:       $PLATFORMS"
echo "Context:         $CONTEXT_DIR"
echo "Dockerfile:      $DOCKERFILE"
echo "No cache:        $NO_CACHE"
echo "Version tag too: $PUSH_VERSION_TAG"
echo

# --- AWS / ECR setup ---
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
REPO_URI="${ECR_URI}/${REPO_NAME}"

# Create repo if missing
if ! aws ecr describe-repositories --region "$REGION" --repository-names "$REPO_NAME" >/dev/null 2>&1; then
  echo "ECR repo $REPO_NAME not found; creating..."
  aws ecr create-repository --region "$REGION" --repository-name "$REPO_NAME" >/dev/null
fi

# Make sure tags are mutable so :latest can be overwritten
aws ecr put-image-tag-mutability --region "$REGION" \
  --repository-name "$REPO_NAME" \
  --image-tag-mutability MUTABLE >/dev/null

# ECR login
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$ECR_URI"

# --- Prepare an ephemeral buildx builder (and remember the current one) ---
CURRENT_BUILDER="$(docker buildx ls | awk '/\*/{print $1}' || true)"
TMP_BUILDER="tmp-builder-$(date +%s)"

cleanup() {
  # Restore previous builder if it existed
  if [[ -n "${CURRENT_BUILDER:-}" && "$CURRENT_BUILDER" != "$TMP_BUILDER" && -n "$(docker buildx ls | grep -E "^${CURRENT_BUILDER}\b" || true)" ]]; then
    docker buildx use "$CURRENT_BUILDER" >/dev/null 2>&1 || true
  fi
  # Remove the ephemeral builder
  docker buildx rm "$TMP_BUILDER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker buildx create --use --name "$TMP_BUILDER" >/dev/null

# --- Build & push ---
DATE_TAG="v$(date +%Y%m%d-%H%M%S)"
CACHE_FLAG=""; [[ "$NO_CACHE" == "true" ]] && CACHE_FLAG="--no-cache"

echo "Building and pushing ${REPO_URI}:${IMAGE_TAG} for platforms: ${PLATFORMS}"
docker buildx build \
  --platform "$PLATFORMS" \
  -t "${REPO_URI}:${IMAGE_TAG}" \
  -f "$DOCKERFILE" \
  $CACHE_FLAG \
  --push \
  "$CONTEXT_DIR"

if [[ "$PUSH_VERSION_TAG" == "true" ]]; then
  echo "Also tagging and pushing ${REPO_URI}:${DATE_TAG}"
  docker buildx build \
    --platform "$PLATFORMS" \
    -t "${REPO_URI}:${DATE_TAG}" \
    -f "$DOCKERFILE" \
    $CACHE_FLAG \
    --push \
    "$CONTEXT_DIR"
fi

# --- Show digests for confirmation ---
echo
echo "ECR images for ${REPO_NAME}:"
aws ecr describe-images --region "$REGION" --repository-name "$REPO_NAME" \
  --image-ids imageTag="$IMAGE_TAG" \
  --query 'imageDetails[0].{Tag: imageTags[0], Digest: imageDigest, PushedAt: imagePushedAt}' --output table

if [[ "$PUSH_VERSION_TAG" == "true" ]]; then
  aws ecr describe-images --region "$REGION" --repository-name "$REPO_NAME" \
    --image-ids imageTag="$DATE_TAG" \
    --query 'imageDetails[0].{Tag: imageTags[0], Digest: imageDigest, PushedAt: imagePushedAt}' --output table
  echo "Version tag pushed: ${DATE_TAG}"
fi

echo "Done. The scheduled/task-run will pull ${REPO_URI}:${IMAGE_TAG} on next start."
