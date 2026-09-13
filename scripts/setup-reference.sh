#!/usr/bin/env bash
#
# Clone the GURPS Game Aid system source into .reference/ so its actor data model
# can be read directly instead of guessed at. The checkout is pinned: reading a
# newer system than the one we declare support for is how we end up coding
# against shapes our users don't have.
#
# Override with GURPS_SYSTEM_REPO / GURPS_SYSTEM_REF to point at a fork or branch.
set -euo pipefail

REPO="${GURPS_SYSTEM_REPO:-https://github.com/crnormand/gurps.git}"
REF="${GURPS_SYSTEM_REF:-v0.18.23}"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dest="$root/.reference/gurps"

if ! command -v git >/dev/null 2>&1; then
  echo "error: git is required to fetch the system reference" >&2
  exit 1
fi

if [ -d "$dest/.git" ]; then
  wanted="$(git -C "$dest" rev-parse -q --verify "refs/tags/$REF^{commit}" || true)"
  if [ -n "$wanted" ] && [ "$wanted" = "$(git -C "$dest" rev-parse HEAD)" ]; then
    echo "gurps system reference already at $REF ($dest)"
    exit 0
  fi

  echo "Updating gurps system reference to $REF..."
  git -C "$dest" fetch --depth 1 --force origin "refs/tags/$REF:refs/tags/$REF"
  git -C "$dest" checkout --force --detach "refs/tags/$REF"
else
  echo "Cloning gurps system reference at $REF..."
  rm -rf "$dest"
  mkdir -p "$(dirname "$dest")"
  git clone --depth 1 --branch "$REF" "$REPO" "$dest"
fi

echo "gurps system reference ready at $dest"
