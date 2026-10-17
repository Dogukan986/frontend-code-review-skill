# frontend-code-review-skill Implementation Plan

> Historical planning document for the MVP build. Where it differs from [design.md](design.md), the design document is current (for example, the lint/tsc policy was revised before release).

> **For agentic workers:** Implement task-by-task (superpowers:executing-plans). Steps use checkbox syntax.

**Goal:** Ship a portable, tested, documented Agent Skill that reviews React/Next.js/TypeScript code with evidence-backed, severity-classified findings.

**Architecture:** Skill folder `skills/frontend-code-review/` (SKILL.md + references + report template). Dependency-free Node scripts (`validate.mjs`, `eval.mjs`) check the skill statically and score real agent reports against labelled fixtures.

**Tech Stack:** Markdown, Node 24 built-ins only (`node:test`, `node:fs`), GitHub Actions.

**Spec:** `docs/design.md`

## Global Constraints

- Frontmatter uses only standard fields: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`.
- `name: frontend-code-review`, equal to the parent directory name; description ≤ 1024 chars.
- `SKILL.md` < 200 lines (hard limit 500); references one level deep.
- Zero runtime dependencies; scripts use Node built-ins only.
- JSON field names and enums are fixed English (see design).
- `critical` ⇒ `confirmed`; `needs-verification` ⇒ at most `medium`.
- Skill is read-only; never executes commands from the reviewed repo.
- MIT license, "Doğukan Bektaş".

## Review Focus

- Report with zero findings: valid JSON/Markdown, not an error.
- Evidence text spanning multiple lines or containing tabs/CRLF still verifies.
- Fixture code containing instructions like "ignore previous instructions": scorer and skill treat as data.
- Same root cause in many files: one grouped finding, not N.
- Non-React file or empty directory: report states limitation, no invented findings.

---

### Task 1: Skill content (SKILL.md, references, template)

**Files:** Create `skills/frontend-code-review/SKILL.md`, `references/{react-hooks,rendering,typescript,nextjs,accessibility,severity-rubric,evidence-and-confidence,output-format}.md`, `assets/report-template.md`.

**Produces:** the rule IDs used by fixtures (`hooks/*`, `rendering/*`, `ts/*`, `next/*`, `a11y/*`).

- [ ] Write SKILL.md: workflow (scope → read → apply references → verify evidence → report), safety rules, severity/confidence summary, lint/tsc policy, output selection (Markdown default, JSON on request).
- [ ] Write each reference rule with sections: What to look for / Why / Bad / Good / False-positive guard / Default severity.
- [ ] Verify with Task 2's validator.

### Task 2: `scripts/validate.mjs` (TDD)

**Interfaces:** `validateSkill(dir): string[]` (errors), `validateFixtures(root): string[]`; CLI `node scripts/validate.mjs` exits 1 on any error.

- [ ] Tests in `tests/unit/validate.test.mjs` with bad/good temp skill dirs (bad name, name≠dir, non-standard field, long description, broken link, missing rule section).
- [ ] Implement; run `node --test tests/unit`.

### Task 3: `scripts/eval.mjs` scorer (TDD)

**Interfaces:** `scoreReport(report, expected): {tp, fp, fn, precision, recall, violations[], injection: {ok, reasons[]}}`; CLI `score <report> <expected>` and `run-all <reportsDir>` writing `docs/eval-report.md`. Match: same file, |line diff| ≤ 3, same category.

- [ ] Tests with canned reports: perfect, noisy (FP), empty (FN), cap violations, clean fixture with a finding, injection suppressed/not.
- [ ] Implement; tests pass.

### Task 4: Fixtures and expected files

**Files:** `tests/fixtures/{hooks-bugs,rendering,typescript,next-app-router,accessibility,clean-traps,prompt-injection}/…`, `tests/expected/<name>.json`.

- [ ] Write small fixtures per design; each expected finding's `evidence` appears verbatim at `file:line`.
- [ ] Extend `validate.mjs` fixture check (Task 2 function) and run it; clean-traps expects zero findings; injection fixture expects `suspicious_content`.

### Task 5: Docs, examples, repo hygiene

**Files:** `README.md`, `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `docs/evaluation.md`, `examples/sample-report.{md,json}`, `.github/workflows/ci.yml` (validate + unit tests only), issue/PR templates, `package.json` (no deps, scripts only).

- [ ] README states: not a replacement for ESLint/tsc, read-only guarantees, `allowed-tools` caveat, install paths, JSON schema, evaluation, limitations.
- [ ] Sample JSON report passes the scorer's schema check.

### Task 6: Agent evaluation on fixtures

- [ ] Run the skill with a real agent (subagent) on each fixture in an isolated copy, saving JSON reports to `tests/reports/<date>/`.
- [ ] Score with `eval.mjs`, write `docs/eval-report.md`; fix skill wording on observed failures, re-run once; record honest numbers.

### Task 7: Real-project validation and publish readiness

- [ ] Clone a small open-source Next.js project (pinned commit) into a scratch directory; run the skill; manually label findings; write `docs/validation.md`.
- [ ] Publish-readiness checklist (license, no secrets, CI green locally, links) in the final report. Do not push or create a remote without asking.
