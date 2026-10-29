#!/bin/bash
# Stop hook: if source files have uncommitted changes but README.md / CLAUDE.md
# have not, ask Claude to review the docs before finishing.
input=$(cat)

# Already continued once because of this hook: let Claude stop (avoids a loop).
[ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Uncommitted paths, excluding docs, local config and generated pages
# (generated pages change only when tools/ does).
changed=$(git status --porcelain | cut -c4- | sed 's/.* -> //' \
  | grep -Ev '^(README\.md|CLAUDE\.md|\.claude/|tradeoffs/)' )
[ -z "$changed" ] && exit 0

# Docs already updated alongside the source changes.
git status --porcelain | cut -c4- | grep -Eq '^(README\.md|CLAUDE\.md)$' && exit 0

jq -n --arg files "$changed" '{
  decision: "block",
  reason: ("Uncommitted source changes, but README.md and CLAUDE.md were not updated:\n" + $files + "\n\nReview both files against these changes (trade-off list, categories and their order, file layout, commands, architecture notes). Update whatever is stale. If both are still accurate, say so and stop.")
}'
