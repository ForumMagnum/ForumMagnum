#!/bin/bash

print_help () {
  cat <<-END
		Usage: scripts/runDevInstance.sh [environment-name] [nextjs-options]

		Syncs environment variables from a Vercel environment that is linked to the current
		working directory, then runs a development server. Any options after the environment
		name are passed through to nextjs.
	END
}

VERCEL_ENV_NAME=development

while [[ "$#" != 0 ]]; do
  ARG="$1"; shift
  case "$ARG" in
    -h|--help)
	    print_help
	    exit 1
	    ;;
    dev|development)
      VERCEL_ENV_NAME=development
      break
      ;;
    prod|production)
      VERCEL_ENV_NAME=production
      break
      ;;
    *)
      echo "Unrecognized argument: $ARG"
      print_help
      exit 1
      ;;
  esac
done


# Sync environment variables from a linked Vercel environment with `vercel env pull`.
# Suppress the spammy output, then show the output iff the command fails.
pull_envvars () {
  # The 2>&1 here merges stdout and stderr. Unfortunately "vercel env pull"
  # outputs everything (including non-error spammy status information) to
  # stderr, so the customary "redirect stdout but show stderr" doesn't work.
  VERCEL_PULL_OUTPUT=$(vercel env pull .env.local --environment="$VERCEL_ENV_NAME" 2>&1)
  VERCEL_PULL_EXIT_STATUS="$?"
  
  if [[ "$VERCEL_PULL_EXIT_STATUS" != 0 ]]; then
    echo "Syncing environment variables from Vercel failed"
    echo "$VERCEL_PULL_OUTPUT"
    exit 1
  fi
  
  return "$VERCEL_PULL_EXIT_STATUS"
}

run_dev_server () {
	# We use node directly rather than going through yarn so that we can use some
	# flags to silence spammy console logs on start.
	#
	# Node flags used:
  #   --inspect: Enable debugging
  #   --inspect-publish-uid=http: Suppress message about how to connect to the debugger
  #   --no-deprecation: Suppress deprecation warnings about punycode
  # The command itself: ./node_modules/.bin/next dev
  # Nextjs flags used:
  #    --turbopack: Enables the beta turbopack bundler. Makes route compilation
  #        ~2x faster, at the expense of bugs that, as far as we know, don't
  #        impact development.
  #    "$@": Pass through exra arguments that were passed to the script, eg --port
  NODE_OPTIONS="--inspect --inspect-publish-uid=http --no-deprecation" ./node_modules/.bin/next dev --turbopack "$@"
}

pull_envvars && \
  run_dev_server "$@"
