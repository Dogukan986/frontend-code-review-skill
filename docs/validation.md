# Real-project validation

Second validation environment from the design: a real open-source Next.js project, with every finding checked by hand against the source. Fixture results are in [eval-report.md](eval-report.md).

## Setup

- Project: [vercel/next-learn](https://github.com/vercel/next-learn), directory `dashboard/final-example` (Next.js App Router, TypeScript, 43 source files)
- Pinned commit: `bb2558441a6673ab76c89914c25018bffa27a2ba`
- Cloned into an isolated directory; nothing from it was installed, built or executed.
- Prompt: "Review the whole project … give me a machine-readable JSON report", one Claude Code subagent (sonnet).
- **Run 1** used an earlier skill version (lint/tsc categories excluded). **Run 2** used the final skill (identical to the repository state at the time of writing). Raw reports: [eval-runs/real-project/](eval-runs/real-project/).

## Findings and manual verdicts

| # | Run | Rule | Location | Reported | Verdict | Notes |
|---|---|---|---|---|---|---|
| 1 | 1 | `ts/unvalidated-external-data` | `app/dashboard/invoices/page.tsx:23` | medium / likely | **True** | `Number(searchParams?.page) \|\| 1` accepts `-5`; the page number becomes a negative `OFFSET` in `fetchFilteredInvoices` (`app/lib/data.ts:93`, `:114`). PostgreSQL rejects negative OFFSET (inferred, not executed). Small impact: error page on a hand-edited URL. |
| 2 | 1, 2 | `a11y/unlabeled-control` | `app/ui/invoices/buttons.tsx:19` | medium / confirmed | **True** | `UpdateInvoice` renders a `Link` that contains only an icon; no text, `aria-label` or visually hidden text. Run 2 also reports pagination arrows in the same finding. |
| 3 | 1, 2 | `a11y/unlabeled-control` | `app/ui/search.tsx:29` | medium / confirmed | **True** | `<label htmlFor="search">` exists but the `<input>` has no `id="search"`; the label is not associated. The placeholder gives a fallback name, so impact is moderate. |
| 4 | 1 | `ts/non-null-assertion` | `app/lib/data.ts:12` | low / likely | **True, low value** | `process.env.POSTGRES_URL!` in 4 files. Accurate but typical for a tutorial. |
| 5 | 2 | `ts/unvalidated-external-data` | `app/lib/data.ts:71` | high / likely | **True** | `Number(data[0].count ?? '0')` reads `.count` of the postgres.js result. Per the postgres.js documentation (v3.4.6, "Result Array → .count") that property is the number of rows returned or affected, which is 1 for `SELECT COUNT(*)`; the value is in `data[0][0].count`. So the dashboard cards would show 1 invoice and 1 customer. Not executed; based on the library docs. Severity `high` is arguable. |
| 6 | 2 | `a11y/unlabeled-control` | `app/ui/dashboard/nav-links.tsx:42` | medium / likely | **True** | Link text is `<p className="hidden md:block">`, so below the `md` breakpoint the links contain only an icon; `display:none` text is not exposed to assistive technology. Icon libraries usually mark their SVGs `aria-hidden`, which the agent flagged as an assumption. The Sign Out button has the same pattern. |

**Result:** run 1 reported 4 findings, run 2 reported 4; 6 distinct findings overall, all 6 judged real (0 false positives; target ≥ 80% confirmed). No severity-cap violations. Evidence checked against the source.

**Variation between runs:** only 2 of 6 findings (#2, #3) appeared in both runs. #1 and #4 were reported only by run 1, #5 and #6 only by run 2. This is one run of one model each on different skill versions, so the difference cannot be attributed to the skill change; it does show that a single review does not find everything, which matches the fixture results (recall of planted defects is high, recall of everything real is unknown).

## What this does *not* show

- **Recall is unknown.** No ground truth exists for this project. The agent also noted, and correctly left out, topics outside the skill's scope (unauthenticated server actions and seed route, floating-point `amount * 100`).
- **Small sample.** Two runs, one model, one small tutorial codebase maintained by a framework vendor. Do not read "6/6 true" as a measured precision for arbitrary projects.
- **Verdicts are not independent.** The AI assistant that helped build this project (Claude) checked each claim against the source and the library docs; no outside reviewer did. Nothing was executed, so #1 and #5 are inferred from semantics. A maintainer or contributor should re-verify before the numbers are quoted.
- **No ESLint config** exists in the project root, so the lint-overlap behaviour of the skill could not be exercised on real code.

## Fixture limitations (summary)

The seven fixtures are small, written by the skill's author, and contain 17 planted defects; extra findings are labelled false positives even when defensible. High fixture scores demonstrate that the pipeline works and that the skill behaves on easy inputs, not that it is accurate on arbitrary codebases. See [eval-report.md](eval-report.md) for the full list of limitations.
