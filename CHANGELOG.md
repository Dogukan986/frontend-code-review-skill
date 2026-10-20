# Changelog

Follows [Semantic Versioning](https://semver.org/). While the version is `0.x`, rule wording and the report schema may change in minor releases; such changes are listed here.

## [0.1.0] - 2026-10-20

First public release.

- Agent Skill `frontend-code-review`: read-only review of React, Next.js and TypeScript code (hooks, rendering, TypeScript, Next.js, accessibility) with evidence-backed findings, Markdown or JSON output (`schema_version` "1").
- Deterministic checks (`npm run check`), a scorer for manual agent evaluation, seven fixtures with labelled expectations.
- CI with pinned actions and the official `skills-ref` validator; `SECURITY.md`, Dependabot config for Actions.
