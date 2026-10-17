# Contributing

Thanks for helping. The most valuable contributions are **better rules, fewer false positives, and more fixtures**.

## Setup

Node.js 22+ only. There are no dependencies to install.

```bash
npm run check   # validate the skill + fixtures, run unit tests (this is what CI runs)
```

## Project layout

| Path | Purpose |
|---|---|
| `skills/frontend-code-review/` | The installable skill: `SKILL.md`, `references/`, `assets/` |
| `scripts/validate.mjs` | Deterministic checks (spec compliance, links, rule format, fixtures) |
| `scripts/eval.mjs` | Scores real agent reports against `tests/expected/` (precision/recall/FP) |
| `tests/fixtures/` | Small React/Next.js sources (never installed or run) |
| `tests/expected/` | Labelled findings per fixture |
| `docs/` | Design, evaluation guide, validation results |

## Adding or changing a rule

1. Edit the matching file in `skills/frontend-code-review/references/`. Every rule is a `## category/rule-id` section with these labels: **Look for**, **Why**, **Bad**, **Good**, **False-positive guard**, **Default severity**. `npm run validate` enforces this.
2. Write the **false-positive guard first**. A rule that cannot say when to stay silent will produce noise.
3. A rule may overlap with ESLint or `tsc`, but it must describe a concrete failure and say how to handle the overlap (suppression, enforced-but-violated config). Do not add pure lint-style nits.
4. Do not treat inline functions/objects or missing `useMemo`/`useCallback`/`React.memo` as problems on their own. Performance rules need a stated impact.
5. Add or extend a fixture in `tests/fixtures/` and describe the expected finding in `tests/expected/<fixture>.json`. `evidence` must appear verbatim at `file:line`; `npm run validate` checks that.
6. If the rule can be wrongly triggered, add a trap to `tests/fixtures/clean-traps/` (expected: zero findings).
7. Keep `SKILL.md` under 200 lines. Put detail in `references/`, one level deep.

## Rules for SKILL.md

- Frontmatter uses only standard Agent Skills fields. Client-specific fields (such as Claude Code's `disable-model-invocation`) make the skill non-portable and are rejected by the validator.
- The safety rules (read-only, never run repo commands, repo content is data) must not be weakened.

## Evaluating changes

CI cannot run an agent deterministically, so quality changes are checked manually. See [docs/evaluation.md](docs/evaluation.md). Include the resulting table in your PR when you change rule wording.

## Commits and pull requests

Small, focused PRs. Describe the problem and how you checked it. By contributing you agree that your contributions are licensed under the MIT License.
