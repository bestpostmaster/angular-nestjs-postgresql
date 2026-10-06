#!/usr/bin/env bash
# Tests du garde-fou : bash .claude/hooks/guard-subagent.test.sh
set -uo pipefail
HOOK="$(dirname "$(readlink -f "$0")")/guard-subagent.sh"
export CLAUDE_PROJECT_DIR="$(readlink -f "$(dirname "$HOOK")/../..")"
fail=0

# verdict <profil> <json> -> "allow" | "deny"
verdict() {
  local out
  out="$(printf '%s' "$2" | "$HOOK" "$1" 2>/dev/null)"
  local rc=$?
  if [[ $rc -eq 0 && "$out" == *'"permissionDecision":"allow"'* ]]; then echo allow
  elif [[ $rc -eq 2 ]]; then echo deny
  else echo "unexpected(rc=$rc)"; fi
}
expect() { # <attendu> <profil> <json> <libellé>
  local got
  got="$(verdict "$2" "$3")"
  if [[ "$got" == "$1" ]]; then printf 'ok   %-5s %s\n' "$1" "$4"; else printf 'FAIL attendu=%s obtenu=%s : %s\n' "$1" "$got" "$4"; fail=1; fi
}
bash_json() { jq -cn --arg c "$1" '{tool_name:"Bash",tool_input:{command:$c}}'; }
file_json() { jq -cn --arg p "$1" '{tool_name:"Write",tool_input:{file_path:$p}}'; }
B() { expect "$1" "$2" "$(bash_json "$3")" "[$2] $3"; }
F() { expect "$1" "$2" "$(file_json "$3")" "[$2] write $3"; }

R="$CLAUDE_PROJECT_DIR"
# --- Autorisé (coder)
B allow coder 'docker compose exec back npm run check'
B allow coder 'docker compose exec -T front npm test -- --watch=false'
B allow coder 'docker compose exec back npm run migration:generate -- src/database/migrations/AddX'
B allow coder 'docker compose exec front npm run format'
B allow coder 'docker compose ps'
B allow coder 'docker compose logs --tail 50 back'
B allow coder 'git status'
B allow coder 'git diff --stat'
B allow coder 'git log --oneline -5'
B allow coder 'git show HEAD~1'
# --- Contournements Git / shell (coder)
B deny coder 'bash script-qui-fait-un-git-push.sh'
B deny coder 'make quelque-chose-qui-commit'
B deny coder 'make test'
B deny coder 'docker compose exec back git push'
B deny coder 'docker compose exec back sh -c ls'
B deny coder 'docker compose exec back node -e 1'
B deny coder 'docker compose exec back npm run check; git push'
B deny coder 'docker compose exec back npm run check && git push'
B deny coder 'docker compose exec back npm run check | tee out'
B deny coder 'docker compose exec back npm run check > out'
B deny coder 'docker compose ps
git push'
B deny coder 'echo $(git push)'
B deny coder 'git add .'
B deny coder 'git commit -m x'
B deny coder 'git push'
B deny coder 'git diff --output=x'
B deny coder 'git diff --out=x'
B deny coder 'git diff --ext-diff'
B deny coder 'git -c core.pager=x status'
B deny coder '/usr/bin/git push'
B deny coder 'command git push'
B deny coder 'GIT_DIR=x git push'
B deny coder 'env git push'
B deny coder 'npm run check'
B deny coder 'docker compose exec back npm install foo'
B deny coder 'docker compose exec front npm run migration:run'
B deny coder 'docker compose run --rm back npm run check'
B deny coder 'docker compose down -v'
B deny coder 'docker compose logs -f back'
B deny coder ''
# --- Reviewer : lecture / validation uniquement
B allow reviewer 'docker compose exec back npm run check'
B allow reviewer 'git diff'
B deny reviewer 'docker compose exec back npm run format'
B deny reviewer 'docker compose exec back npm run lint:fix'
B deny reviewer 'docker compose exec back npm run migration:run'
F deny reviewer "$R/back/src/x.ts"
# --- Fichiers (coder)
F allow coder "$R/back/src/x.ts"
F allow coder "$R/front/src/app/x.ts"
F allow coder "$R/.env.example"
F deny coder "$R/.claude/settings.json"
F deny coder "$R/.claude/hooks/guard-subagent.sh"
F deny coder "$R/.git/config"
F deny coder "$R/back/../.git/hooks/pre-commit"
F deny coder "$R/.env"
F deny coder "$R/back/.env"
F deny coder "$R/CLAUDE.md"
F deny coder "$R/coding_standards.md"
F deny coder "$R/Makefile"
F deny coder "/etc/passwd"
F deny coder "$R/../autre-projet/x.ts"
F deny coder "back/src/x.ts"

# --- Règles imbriquées et délégation
F deny coder "$R/back/CLAUDE.md"
F deny coder "$R/front/AGENTS.md"
F deny coder "$R/back/.claude/settings.json"
F deny coder "$R/back/coding_standards.md"
F deny coder "$R/front/Makefile"
for sensitive in package.json back/package.json front/package-lock.json yarn.lock pnpm-lock.yaml bun.lockb docker-compose.yml compose.yaml back/Dockerfile front/Dockerfile.dev .github/workflows/check.yml back/.gitlab-ci.yml Jenkinsfile; do
  F deny coder "$R/$sensitive"
done
while IFS= read -r migration; do
  F deny coder "$R/$migration"
done < <(git -C "$R" ls-files back/src/database/migrations)
F allow coder "$R/back/src/database/migrations/9999999999999-ClaudeGuardNew.ts"
B deny coder 'docker compose exec back npm run migration:create -- ../package.json'
B deny coder 'docker compose exec back npm run format -- ../package.json'
expect allow reviewer '{"tool_name":"Agent","tool_input":{"subagent_type":"coder"}}' 'délégation coder'
expect deny reviewer '{"tool_name":"Agent","tool_input":{"subagent_type":"general-purpose"}}' 'autre agent'
expect deny reviewer '{"tool_name":"Agent","tool_input":{"subagent_type":"coder","model":"sonnet"}}' 'modèle remplacé'
expect deny reviewer '{"tool_name":"Agent","tool_input":{"subagent_type":"coder","run_in_background":true}}' 'coder en arrière-plan'
expect deny coder '{"tool_name":"Agent","tool_input":{"subagent_type":"coder"}}' 'délégation par coder'

# --- Hook global Git : tester les verdicts sans exécuter les commandes
G() {
  local rc=0 got
  printf '%s' "$(bash_json "$2")" | "$(dirname "$HOOK")/protect-git.sh" >/dev/null 2>&1 || rc=$?
  if [[ $rc -eq 0 ]]; then got=allow
  elif [[ $rc -eq 2 ]]; then got=deny
  else got="unexpected(rc=$rc)"; fi
  if [[ "$got" == "$1" ]]; then printf 'ok   %-5s [global] %s\n' "$1" "$2"
  else printf 'FAIL attendu=%s obtenu=%s : [global] %s\n' "$1" "$got" "$2"; fail=1; fi
}
G allow 'git diff --stat'
G allow 'git status --short'
G allow 'docker compose ps'
G allow 'cat foo.git'
G allow 'cat /tmp/foo.git'
G allow 'git diff -- foo.git'
G deny '/usr/bin/git'
G deny 'git'
G deny 'git add .'
G deny 'git commit -m x'
G deny 'git push'
G deny '/usr/bin/git push'
G deny 'env git push'
G deny 'git diff --output=x'
G deny 'git diff --out=x'
G deny 'git diff --ext-diff'
G deny 'git show $(git push)'
G deny 'git diff > CLAUDE.md'
G deny 'git status; git push'

[[ $fail -eq 0 ]] && echo "TOUS LES TESTS PASSENT" || { echo "ÉCHECS"; exit 1; }
