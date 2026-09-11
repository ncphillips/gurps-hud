#!/bin/bash
#
# Claude Code on the web starts each session from a fresh clone: no node_modules, and a Chromium
# that may not be the build this project's Playwright pins. This puts both right so `npm test`,
# `npm run test:e2e` and `npm run test:a11y` all run without the agent having to set anything up.
#
set -euo pipefail

# Local sessions already have a working checkout; nothing here applies to them.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# `npm ci` rather than `npm install`: it installs exactly the lockfile and never rewrites it, so a
# session never opens on a dirty tree. Skipped when a cached container already has the modules the
# current lockfile describes, which is the common case on resume.
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
  npm ci --no-audit --no-fund
fi

#
# Both browser suites need a Chromium: the e2e specs drive the dev harness, and the a11y scans
# mount components through Vitest's browser mode. The image ships one at $PLAYWRIGHT_BROWSERS_PATH,
# but it is only the right one if its build number matches what playwright-core pins -- so try the
# real install first, and fall back to the pre-installed binary when the download host is not on
# the environment's network allowlist. `PLAYWRIGHT_CHROMIUM_PATH` is read by playwright.config.ts
# and vitest.config.ts, and is unset everywhere else, so this is a no-op locally and in CI.
#
BROWSERS="${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"
if ! npx playwright install chromium >/dev/null 2>&1; then
  if [ -x "$BROWSERS/chromium" ]; then
    # SessionStart fires again on resume and clear, so only add the export once.
    grep -qs PLAYWRIGHT_CHROMIUM_PATH "$CLAUDE_ENV_FILE" ||
      echo "export PLAYWRIGHT_CHROMIUM_PATH=$BROWSERS/chromium" >> "$CLAUDE_ENV_FILE"
    echo "playwright: download blocked; using the pre-installed $BROWSERS/chromium"
  else
    echo "playwright: no usable chromium; the browser suites will not run" >&2
  fi
fi
