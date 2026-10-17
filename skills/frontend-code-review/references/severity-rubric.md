# Severity Rubric

Severity measures **impact if the finding is real**. Confidence (see [evidence](evidence-and-confidence.md)) measures how sure you are. Both are required, and they interact through caps.

| Severity | Definition | Examples |
|---|---|---|
| `critical` | Verified, serious impact: crash, data loss or corruption, broken core user flow, secret exposed to the browser, page unusable for assistive-technology users. | Server-only secret read in a `"use client"` component; hook called conditionally so the component throws on a state change. |
| `high` | Likely user-visible bug or significant defect in a main flow. | Stale closure that submits old data; missing cleanup of a subscription that leaks and fires after unmount; form that cannot be completed with a keyboard. |
| `medium` | Real defect with limited blast radius, or a risk that needs one more condition. | Index as `key` on a reorderable list with local state; unvalidated `as` cast of API data; large above-the-fold `<img>`. |
| `low` | Minor, cosmetic or best-practice issue with small real effect. | Unnecessary `"use client"` on a leaf; non-null assertion on a value that is almost always present. |

## Caps (must be enforced before output)

1. `critical` requires confidence `confirmed`, and an impact you can describe concretely. Otherwise downgrade.
2. `needs-verification` is never above `medium`.
3. `likely` is never `critical`.
4. A performance finding without stated impact and evidence is dropped, or `low`.
5. A finding whose only support is "this pattern is commonly a problem" is dropped.

## Calibration questions

- Would a maintainer stop a release for this? → `critical`/`high`.
- Would a user notice, or could a test fail because of it? → `high`/`medium`.
- Would it only matter in review or in a future refactor? → `low`.
- When unsure between two levels, choose the lower and explain the condition that would raise it.
