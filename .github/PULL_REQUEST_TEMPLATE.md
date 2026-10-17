## What and why

<!-- Describe the change and the problem it solves. -->

## Checklist

- [ ] `npm run check` passes
- [ ] New or changed rules follow the rule format in `skills/frontend-code-review/references/` (Look for / Why / Bad / Good / False-positive guard / Default severity)
- [ ] The rule has a false-positive guard and describes a concrete failure (overlap with ESLint/`tsc` is fine, pure lint nits are not)
- [ ] If behaviour changed: fixture and `tests/expected/*.json` updated (evidence verbatim at `file:line`)
- [ ] `SKILL.md` frontmatter still uses only standard Agent Skills fields
