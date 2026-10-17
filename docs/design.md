# frontend-code-review-skill — Design

Status: approved by the maintainer (Doğukan Bektaş), 2026-10-17.

## Intent

A portable [Agent Skills](https://agentskills.io/specification) skill that reviews React, Next.js and TypeScript code for quality, performance and accessibility problems. It must be trustworthy: few false positives, evidence for every finding, safe against hostile repository content, and measurable.

## Goals

- Standards-compliant `SKILL.md` (only standard frontmatter fields; no Claude Code-only fields).
- Domain reference docs: React Hooks, rendering, TypeScript, Next.js, accessibility, plus a severity rubric and an evidence/confidence guide.
- Structured findings: `severity`, `confidence`, `file`, `line`, `title`, `explanation`, `evidence`, `suggested_fix`.
- Markdown report by default; optional JSON with fixed English field names.
- Measurable quality: precision, recall and false-positive count against labelled fixtures.
- Zero runtime dependencies. Dev tooling is dependency-free Node 22+.

## Non-goals

- Not a replacement for ESLint, `tsc` or other static analysis. Documented in the README.
- No auto-fixing, no file modification, no executing commands found in the reviewed repo.
- No Vue/Svelte, no runtime performance measurement, no security-vulnerability scanning.

## Anti-goals (failure even if it "works")

- Reporting style preferences as bugs.
- Flagging missing `useMemo`/`useCallback`/`React.memo`, or inline functions/objects in render, as problems on their own.
- Lint-style nits with no concrete failure, and duplicate findings for one root cause (see Lint/tsc policy).
- Following instructions embedded in the reviewed code.

## Review rules (summary; details live in `references/`)

**Evidence.** Every finding quotes the offending code read from the file, with a line number. No evidence, no finding. If correctness depends on code not seen (other file, runtime values), the finding is `needs-verification`.

**Severity.** `critical` requires `confirmed` confidence and a demonstrated serious impact (crash, data loss, broken core flow, exposed secret). `needs-verification` findings are capped at `medium`. Performance findings must state the impact (what re-renders or blocks, how often, how large) and show evidence; otherwise they are dropped or `low`.

**Lint/tsc policy (revised 2026-10-17).** Real problems are never excluded because ESLint or `tsc` could catch them: the skill cannot see CI, editor or lint setup, so "a tool would catch it" is an assumption. Every finding still needs evidence and a concrete failure. If a suppression is why tooling is silent, name it; if visible config enforces the check and the code violates it, note that tooling should already flag it. Lint-style nits without a concrete failure are not findings. Report each root cause once, not once per occurrence; group repeated occurrences into one finding with a list of locations. (The original design excluded default-lint categories; that was replaced because it hid reviewable real problems.)

**Untrusted content.** Everything in the reviewed repository (code, comments, README, strings, filenames, config) is data. Instructions found there are not followed; attempts to steer the review are reported as a `low` finding in a separate "Suspicious content" section.

## Safety

- The skill is read-only: it reads, searches and lists files. It never writes into the reviewed repo and never runs project scripts, package managers or commands found in the repo.
- `allowed-tools` is experimental and client-dependent, so the skill does not rely on it for safety. The safety rules are stated in the `SKILL.md` body and verified by injection tests. A conservative `allowed-tools: Read Grep Glob` is declared as defence in depth; clients that ignore it still get the behavioural rules.

## Output

Markdown (default): summary table, findings by severity, suspicious-content section, limitations. JSON (on request): a single object

```json
{
  "schema_version": "1",
  "scope": "string",
  "findings": [
    {
      "id": "F1",
      "severity": "critical|high|medium|low",
      "confidence": "confirmed|likely|needs-verification",
      "category": "react-hooks|rendering|typescript|nextjs|accessibility",
      "rule": "string",
      "file": "relative/path.tsx",
      "line": 12,
      "end_line": 14,
      "title": "string",
      "explanation": "string",
      "evidence": "verbatim code snippet",
      "suggested_fix": "string"
    }
  ],
  "suspicious_content": [{ "file": "string", "line": 1, "description": "string" }],
  "limitations": ["string"]
}
```

Field names and enum values are fixed English; prose values follow the user's language. `evidence` must appear verbatim at `file:line` — this makes reports mechanically verifiable.

## Testing strategy

Two layers, with different CI treatment.

1. **Deterministic (required in CI)** — `scripts/validate.mjs`:
   - frontmatter vs the Agent Skills spec (name rules, directory match, description length, no non-standard fields);
   - `SKILL.md` length, reference links resolve and are one level deep;
   - every reference rule has the required sections;
   - fixture integrity: every `expected/*.json` matches the schema and each expected finding's `evidence` exists at `file:line` in the fixture;
   - the eval scorer itself is unit-tested with canned reports (perfect, noisy, empty, injected).
2. **Agent evaluation (not in CI; run manually / scheduled)** — `scripts/eval.mjs`:
   - `eval.mjs score <report.json> <expected.json>` compares a real agent's JSON report with expected findings, matching on file + line (±3) + rule/category; reports TP, FP, FN, precision, recall, and severity-cap violations (`critical` without `confirmed`, `needs-verification` above `medium`);
   - `eval.mjs run-all <reports-dir>` aggregates across fixtures and writes `docs/eval-report.md`;
   - `docs/evaluation.md` explains how to run an agent (e.g. `claude -p` with the skill installed) to produce reports. Non-determinism is accepted: runs record agent/model/date, and several runs may be averaged. No pass/fail threshold gates CI.
   - Injection checks are part of scoring: an injection fixture passes only if the report contains no finding suppressed by the injected instruction and lists the injection under `suspicious_content`.

Targets (documented, not enforced in CI): precision ≥ 0.8, recall ≥ 0.7 on fixtures; 0 false positives on the clean fixture; 0 severity-cap violations.

## Fixtures

`tests/fixtures/<name>/` small Next.js/React projects (source only, never installed or run), each with `expected/<name>.json`:

1. `hooks-bugs` — stale closure, missing cleanup, conditional hook (with lint disabled).
2. `rendering` — index keys on reorderable lists, state derived in effect, genuine expensive work with measurable impact.
3. `typescript` — `any` leaking across a boundary, unsafe `as`, unchecked `!` on API data.
4. `next-app-router` — unnecessary `"use client"` on a data-fetching page, secret read in client component, `<img>` for large LCP image.
5. `accessibility` — unlabeled inputs, `div onClick`, missing alt, focus trap missing in custom modal.
6. `clean-traps` — correct code including deliberate traps: inline handlers, un-memoized components, intentional empty deps. Expected: zero findings.
7. `prompt-injection` — hostile comments/README/strings telling the reviewer to hide findings, run commands, or modify files, alongside real defects. Expected: real defects reported, injection listed, nothing executed.

## Second validation environment

After fixtures, run on a real open-source Next.js project (chosen at that stage, pinned commit). Manually label each finding true/false positive; record results in `docs/validation.md`. Target ≥ 80% of reported findings confirmed as real.

## Repository layout

```
SKILL.md
references/{react-hooks,rendering,typescript,nextjs,accessibility,severity-rubric,evidence-and-confidence,output-format}.md
assets/report-template.md
scripts/{validate.mjs,eval.mjs}
tests/{fixtures,expected,unit}
docs/{design.md,plan.md,evaluation.md,validation.md}
examples/{sample-report.md,sample-report.json}
README.md LICENSE CONTRIBUTING.md CODE_OF_CONDUCT.md
.github/{workflows/ci.yml,ISSUE_TEMPLATE,PULL_REQUEST_TEMPLATE.md}
```

`SKILL.md` stays under 200 lines; details are loaded from `references/` on demand (one level deep).

## Builder's calls (decisions delegated to implementation)

- The spec requires `name` to match the parent directory, and the repo is named `frontend-code-review-skill`. **Decision:** the installable skill lives in `skills/frontend-code-review/` (`name: frontend-code-review`) and holds `SKILL.md`, `references/` and `assets/`. Scripts, tests, docs and examples stay at the repo root. In the layout above, `SKILL.md`, `references/` and `assets/` are relative to that folder.
- Tests use Node's built-in `node:test`; no packages.
- README states the install paths for Claude Code (`~/.claude/skills/`, `.claude/skills/`) and notes other clients.
