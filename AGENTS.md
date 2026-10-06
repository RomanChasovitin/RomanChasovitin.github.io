# cvnextgen — agent contract

Roman's CV site, built with Astro and Bun and published by GitHub Pages from `main` (`.github/workflows/deploy.yml`). Branch `nextgen` is a parallel rewrite; `t3code/cv-next-gen-screens` holds screen work on top of it.

Roman's personal working agreement (`~/.agents/AGENTS.md`) applies on top of this file. This file holds
only what is specific to this project.

## Commands

| Purpose | Command |
|---------|---------|
| Install | `bun install` |
| Run | `bun run dev` |
| Check (types, lint) | `bun run check` |
| Test | none yet |
| Build | `bun run build`, then `bun run preview` to look at the result |

## Rules

- **Branches:** `main` is the default. Use a branch for anything that is not a small, self-contained
  change.
- **Commits:** a short imperative subject in English, one logical change per commit. Push only when
  asked.
- **Specs:** `specs/YYYY-MM-DD-<topic>-design.md`, written by the discuss skill.
- **Gotchas:** `docs/gotchas.md`. Create it with the first non-obvious trap.
- **Tests:** none yet. Add a test stack only as a deliberate project decision.
- **GitHub:** this is a personal repository: use `gh-rch`, not `gh`. Git picks the personal identity
  from the remote URL by itself.
- **The repository is public.** Never commit keys, tokens or personal data beyond what the CV shows. A private SSH key once sat untracked in the folder; `.gitignore` now covers `own_acc*`, and keys belong in `~/.ssh`.
- **A push to `main` deploys the site.** Push to `main` only when asked; work on `nextgen` or a feature branch otherwise.
- **UI changes** need a check in the running site (`bun run dev`) and a screenshot when they change what visitors see.

## Code search

codegraph when the checkout has an index (`codegraph init .` once per checkout); ripgrep otherwise.

## Subagents

- Claude work here runs on the Personal subscription (`claudeAgent_personal`). Its budget is small:
  use subagents only for genuinely parallel work.
- No cross-vendor review in this project: the skills end with self-review and the checks above.

## Skills

`.claude/skills/` (Codex sees them through `.agents/skills`): **discuss** → **build** → **debug**, and
**review** for other people's PRs. They come from the `bond` repository; update them there and
reinstall with `sh <bond>/scripts/install-skills.sh <this repo>`.
