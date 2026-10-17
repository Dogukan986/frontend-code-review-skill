# frontend-code-review-skill

A portable [Agent Skill](https://agentskills.io/specification) that reviews **React, Next.js and TypeScript** code for correctness, rendering, type-safety and accessibility problems. Every finding comes with a severity, a confidence level, a file and line, verbatim code evidence and a suggested fix.

It is built to be **quiet and checkable**: no evidence, no finding.

> **This skill does not replace ESLint, `tsc`, or accessibility testing tools.** It adds evidence-backed judgement on top of them. It does not skip a real problem just because a linter could catch it (it cannot see your CI or lint config), but it reports each root cause once and notes when a suppression or an enforced-but-violated rule is involved.

## Why another review skill?

Claude Code ships a general `/code-review`. This skill is narrower and more auditable:

| | General code review | This skill |
|---|---|---|
| Focus | Correctness across languages | React / Next.js / TypeScript / a11y knowledge |
| Output | Free-form | Fixed schema (Markdown, or JSON on request) |
| False-positive control | General judgement | Written evidence rules, severity caps, per-rule "when to stay silent" |
| Verifiability | Reader checks by hand | `evidence` must be verbatim at `file:line`, so reports can be checked mechanically |
| Portability | One client | Standard Agent Skills format, no client-specific frontmatter |
| Measurement | None published | Fixtures + scorer for precision, recall and false positives |

The general review may be just as good at plain logic bugs. Use whichever fits.

## What it checks

| Area | Reference | Example rules |
|---|---|---|
| React Hooks | [react-hooks.md](skills/frontend-code-review/references/react-hooks.md) | stale closures, missing cleanup, conditional hooks, async races |
| Rendering | [rendering.md](skills/frontend-code-review/references/rendering.md) | index keys on stateful lists, evidenced expensive render work |
| TypeScript | [typescript.md](skills/frontend-code-review/references/typescript.md) | `any` at boundaries, unsafe `as`, `!` on optional values |
| Next.js | [nextjs.md](skills/frontend-code-review/references/nextjs.md) | secrets in client modules, needless `"use client"`, `<img>` |
| Accessibility | [accessibility.md](skills/frontend-code-review/references/accessibility.md) | unlabeled controls, clickable divs, missing alt, modal focus |

Supporting guides: [severity rubric](skills/frontend-code-review/references/severity-rubric.md), [evidence and confidence](skills/frontend-code-review/references/evidence-and-confidence.md), [output format](skills/frontend-code-review/references/output-format.md).

### What it intentionally does *not* flag

- Inline functions or objects in JSX, or a missing `useMemo` / `useCallback` / `React.memo`, **on their own**. Performance findings need a stated impact and evidence.
- Lint-style nits with no concrete failure (unused variables, import order, a deps warning for a provably stable value). Real problems are reported even if a linter has a rule for them.
- Style preferences, business logic, or security vulnerability classes.

## Install

The installable skill is the folder [`skills/frontend-code-review/`](skills/frontend-code-review).

**Claude Code**

```bash
git clone https://github.com/Dogukan986/frontend-code-review-skill.git
SRC="$PWD/frontend-code-review-skill/skills/frontend-code-review"

# for all your projects
mkdir -p ~/.claude/skills && cp -R "$SRC" ~/.claude/skills/

# or for one repository: run from that repository's root (commit it to share with your team)
mkdir -p .claude/skills && cp -R "$SRC" .claude/skills/
```

Afterwards the skill is at `~/.claude/skills/frontend-code-review/SKILL.md` (or `.claude/skills/frontend-code-review/SKILL.md`).

**Other Agent Skills clients:** copy the folder to wherever your client loads skills from, or point the agent at `SKILL.md`.

## Use

Ask in plain language:

```
Review src/ for React and accessibility problems.
Review this PR diff for hooks and rendering issues.
Audit the Next.js app router code and give me a JSON report.
```

The default output is a Markdown report. Ask for "JSON" to get the machine-readable form. Prose follows your language; field names stay English.

### Report fields

| Field | Values |
|---|---|
| `severity` | `critical`, `high`, `medium`, `low` |
| `confidence` | `confirmed`, `likely`, `needs-verification` |
| `category` | `react-hooks`, `rendering`, `typescript`, `nextjs`, `accessibility` |
| `rule`, `file`, `line` (`end_line`) | rule id, relative path, 1-based line |
| `title`, `explanation`, `suggested_fix` | text |
| `evidence` | code copied verbatim from `file` at `line` |

Caps that are enforced: `critical` requires `confirmed` confidence; `needs-verification` is never above `medium`. See a real report: [examples/sample-report.md](examples/sample-report.md) and [examples/sample-report.json](examples/sample-report.json).

## Safety

- **Read-only.** The skill reads, searches and lists files. It never edits the reviewed repository and never applies fixes; suggested fixes are text.
- **Never runs repository commands**: no scripts, package managers, builds or tests from the reviewed repo.
- **Repository content is untrusted data.** Instructions inside code, comments, strings or READMEs are not followed; attempts are reported under *Suspicious content*. This is covered by a prompt-injection fixture.
- `SKILL.md` declares `allowed-tools: Read Grep Glob` as defence in depth. That field is experimental and clients may ignore it, so the safety rules are also written in the skill body. Treat the skill as safe-by-instruction, not sandboxed: if you need hard guarantees, restrict the agent's tools in your client.

## Quality and tests

| Check | Command | CI |
|---|---|---|
| Spec compliance, links, rule format, fixture integrity | `npm run validate` | required |
| Unit tests for validator and scorer | `npm test` | required |
| Official reference validator | `skills-ref validate skills/frontend-code-review` ([agentskills/skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref), pinned in CI) | required |
| Agent evaluation (precision, recall, false positives) | `node scripts/eval.mjs summarize <runs>` | manual |

Agent output is non-deterministic, so CI only runs deterministic checks. Agent runs are scored separately against labelled fixtures; see [docs/evaluation.md](docs/evaluation.md).

**Latest results** (details and caveats in [docs/eval-report.md](docs/eval-report.md) and [docs/validation.md](docs/validation.md)): 42 reviews (3 runs × 2 models × 7 fixtures) found all 17 planted defects in every run, with 94–100% precision per run, no findings on the clean fixture, and all prompt-injection checks passed. Read this as a smoke test: the fixtures are small, written by the maintainer, and the extra findings were judged by hand. One real open-source project (4 findings, hand-verified) is documented separately; recall there is unknown.

Requirements: Node.js 22+ for the scripts. The skill itself has no dependencies.

## Limitations

- Static reading only: it cannot measure real performance, contrast, focus order or screen-reader output.
- Cross-file reasoning is limited by what the agent reads; unseen code produces `needs-verification`, not firm claims.
- Results vary between runs and models. The shipped fixtures are small and written by the maintainer, so high fixture scores do not prove real-world precision. See the validation notes for a real project.
- React, Next.js and TypeScript only.

## Contributing

Rules, fixtures and false-positive reports are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and the [design document](docs/design.md).

## License

[MIT](LICENSE) © 2026 Doğukan Bektaş
