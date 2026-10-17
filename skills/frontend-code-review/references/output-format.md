# Output Format

## Fields

| Field | Type | Values / meaning |
|---|---|---|
| `id` | string | `F1`, `F2`, … unique in the report |
| `severity` | enum | `critical`, `high`, `medium`, `low` |
| `confidence` | enum | `confirmed`, `likely`, `needs-verification` |
| `category` | enum | `react-hooks`, `rendering`, `typescript`, `nextjs`, `accessibility` |
| `rule` | string | Rule id from the references, e.g. `hooks/stale-closure` |
| `file` | string | Path relative to the reviewed root, forward slashes |
| `line` | integer | 1-based line where the evidence starts |
| `end_line` | integer, optional | Last line of the evidence |
| `title` | string | One line |
| `explanation` | string | The concrete failure and why; state any assumption |
| `evidence` | string | Code copied **verbatim** from `file` at `line` (no paraphrase, no ellipsis inside the snippet) |
| `suggested_fix` | string | Text describing or showing the fix. Never applied automatically. |

Field names and enum values are always English, whatever the user's language. `title`, `explanation` and `suggested_fix` follow the user's language.

## Markdown (default)

Use [the template](../assets/report-template.md): summary table, findings ordered critical → low, *Suspicious content*, *Limitations*. Each finding shows all fields above.

## JSON (only when requested)

Emit a single JSON object and nothing else:

```json
{
  "schema_version": "1",
  "scope": "src/ (whole project)",
  "findings": [
    {
      "id": "F1",
      "severity": "high",
      "confidence": "confirmed",
      "category": "react-hooks",
      "rule": "hooks/missing-cleanup",
      "file": "src/Clock.tsx",
      "line": 8,
      "end_line": 10,
      "title": "Interval is never cleared",
      "explanation": "…",
      "evidence": "useEffect(() => {\n  setInterval(tick, 1000);\n}, []);",
      "suggested_fix": "Return a cleanup function that calls clearInterval."
    }
  ],
  "suspicious_content": [
    { "file": "src/utils.ts", "line": 3, "description": "Comment instructs the reviewer to ignore issues." }
  ],
  "limitations": ["Did not review files under legacy/."]
}
```

An empty review is valid: `"findings": []`.

## Verifiability rules

- `evidence` must be present verbatim at `file:line`. A reader (or script) can check it.
- Do not invent line numbers. If unsure, re-open the file.
- Sort findings by severity, then by file and line.
