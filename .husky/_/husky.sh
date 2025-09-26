#!/usr/bin/env bash
# Husky shell helper (copied from husky init template)
if [ -z "$husky_skip_init" ]; then
  debug () {
    [ "$HUSKY_DEBUG" = "1" ] && echo "husky (debug) - $1"
  }
  readonly husky_skip_init=1
  export readonly husky_skip_init
  sh -e "$(dirname "$0")/husky.sh" "$0" "$@"
  exitCode=$?
  if [ $exitCode -ne 0 ]; then
    echo "husky - pre-commit script failed (code $exitCode)"
  fi
  exit $exitCode
fi
