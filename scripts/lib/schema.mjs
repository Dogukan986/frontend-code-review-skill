// Dependency-free validation of the JSON report format (see docs/design.md).

export const SEVERITIES = ["critical", "high", "medium", "low"];
export const CONFIDENCES = ["confirmed", "likely", "needs-verification"];
export const CATEGORIES = ["react-hooks", "rendering", "typescript", "nextjs", "accessibility"];

const isStr = (v) => typeof v === "string" && v.length > 0;
const isLine = (v) => Number.isInteger(v) && v >= 1;

/** Returns a list of human-readable errors; empty means valid. */
export function validateReportShape(report) {
  const errors = [];
  if (report === null || typeof report !== "object" || Array.isArray(report)) return ["report must be an object"];
  if (report.schema_version !== "1") errors.push('schema_version must be "1"');
  if (!isStr(report.scope)) errors.push("scope must be a non-empty string");
  if (!Array.isArray(report.findings)) errors.push("findings must be an array");
  if (!Array.isArray(report.suspicious_content)) errors.push("suspicious_content must be an array");
  if (!Array.isArray(report.limitations)) errors.push("limitations must be an array");

  const ids = new Set();
  (report.findings ?? []).forEach((f, i) => {
    const at = `findings[${i}]`;
    if (f === null || typeof f !== "object") return errors.push(`${at} must be an object`);
    for (const key of ["id", "rule", "file", "title", "explanation", "evidence", "suggested_fix"]) {
      if (!isStr(f[key])) errors.push(`${at}.${key} must be a non-empty string`);
    }
    if (ids.has(f.id)) errors.push(`${at}.id "${f.id}" is duplicated`);
    ids.add(f.id);
    if (!SEVERITIES.includes(f.severity)) errors.push(`${at}.severity must be one of ${SEVERITIES.join("|")}`);
    if (!CONFIDENCES.includes(f.confidence)) errors.push(`${at}.confidence must be one of ${CONFIDENCES.join("|")}`);
    if (!CATEGORIES.includes(f.category)) errors.push(`${at}.category must be one of ${CATEGORIES.join("|")}`);
    if (!isLine(f.line)) errors.push(`${at}.line must be an integer >= 1`);
    if (f.end_line !== undefined && (!isLine(f.end_line) || f.end_line < f.line)) {
      errors.push(`${at}.end_line must be an integer >= line`);
    }
    errors.push(...severityCapErrors(f).map((e) => `${at}: ${e}`));
  });

  (report.suspicious_content ?? []).forEach((s, i) => {
    if (!s || !isStr(s.file) || !isLine(s.line) || !isStr(s.description)) {
      errors.push(`suspicious_content[${i}] needs file, line (>=1) and description`);
    }
  });
  return errors;
}

/** Severity/confidence caps from references/severity-rubric.md. */
export function severityCapErrors(f) {
  const errors = [];
  if (f.severity === "critical" && f.confidence !== "confirmed") {
    errors.push("critical severity requires confirmed confidence");
  }
  if (f.confidence === "needs-verification" && (f.severity === "critical" || f.severity === "high")) {
    errors.push("needs-verification findings must not be above medium");
  }
  return errors;
}
