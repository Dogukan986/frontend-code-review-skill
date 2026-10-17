import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateSkill, validateFixtures } from "../../scripts/validate.mjs";
import { validateReportShape } from "../../scripts/lib/schema.mjs";

const RULE = (id) => `## ${id}\n\n**Look for:** a\n**Why:** b\n**Bad:**\n\`\`\`ts\nx\n\`\`\`\n**Good:** c\n**False-positive guard:** d\n**Default severity:** low\n`;

function makeSkill({ name = "demo-skill", dir = "demo-skill", fm = "", body = "# Demo\n", refs = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), "skill-"));
  const skillDir = join(root, dir);
  mkdirSync(join(skillDir, "references"), { recursive: true });
  const front = `---\nname: ${name}\ndescription: Does a thing. Use when testing.\n${fm}---\n`;
  writeFileSync(join(skillDir, "SKILL.md"), front + body);
  for (const [f, c] of Object.entries(refs)) writeFileSync(join(skillDir, "references", f), c);
  return skillDir;
}

test("valid minimal skill has no errors", () => {
  assert.deepEqual(validateSkill(makeSkill()), []);
});

test("name must match directory", () => {
  const errs = validateSkill(makeSkill({ name: "other", dir: "demo-skill" }));
  assert.ok(errs.some((e) => e.includes("directory")));
});

test("name rules: uppercase, edge hyphen, double hyphen", () => {
  for (const bad of ["Demo", "-demo", "demo-", "de--mo"]) {
    const errs = validateSkill(makeSkill({ name: bad, dir: bad }));
    assert.ok(errs.some((e) => e.includes("name")), bad);
  }
});

test("rejects non-standard frontmatter fields", () => {
  const errs = validateSkill(makeSkill({ fm: "disable-model-invocation: true\n" }));
  assert.ok(errs.some((e) => e.includes("disable-model-invocation")));
});

test("description over 1024 chars is an error", () => {
  const skillDir = makeSkill();
  const long = "x".repeat(1025);
  writeFileSync(join(skillDir, "SKILL.md"), `---\nname: demo-skill\ndescription: ${long}\n---\nbody\n`);
  assert.ok(validateSkill(skillDir).some((e) => e.includes("1024")));
});

test("SKILL.md over 500 lines is an error", () => {
  const errs = validateSkill(makeSkill({ body: "line\n".repeat(501) }));
  assert.ok(errs.some((e) => e.includes("500")));
});

test("broken relative link is an error", () => {
  const errs = validateSkill(makeSkill({ body: "See [x](references/missing.md)\n" }));
  assert.ok(errs.some((e) => e.includes("missing.md")));
});

test("reference rule must include all required sections", () => {
  const errs = validateSkill(makeSkill({ refs: { "r.md": "# R\n\n## hooks/x\n\n**Look for:** only\n" } }));
  assert.ok(errs.some((e) => e.includes("hooks/x") && e.includes("Why")));
});

test("complete reference rule passes", () => {
  assert.deepEqual(validateSkill(makeSkill({ refs: { "r.md": "# R\n\n" + RULE("hooks/x") } })), []);
});

const goodFinding = {
  id: "F1", severity: "high", confidence: "confirmed", category: "react-hooks", rule: "hooks/missing-cleanup",
  file: "a.tsx", line: 1, title: "t", explanation: "e", evidence: "x", suggested_fix: "f",
};
const goodReport = { schema_version: "1", scope: "s", findings: [goodFinding], suspicious_content: [], limitations: [] };

test("schema accepts a good report and an empty one", () => {
  assert.deepEqual(validateReportShape(goodReport), []);
  assert.deepEqual(validateReportShape({ ...goodReport, findings: [] }), []);
});

test("schema rejects bad enums, missing fields and cap violations", () => {
  const bad = (patch) => validateReportShape({ ...goodReport, findings: [{ ...goodFinding, ...patch }] });
  assert.ok(bad({ severity: "blocker" }).length);
  assert.ok(bad({ suggested_fix: undefined }).length);
  assert.ok(bad({ line: 0 }).length);
  assert.ok(bad({ severity: "critical", confidence: "likely" }).some((e) => e.includes("critical")));
  assert.ok(bad({ severity: "high", confidence: "needs-verification" }).some((e) => e.includes("needs-verification")));
});

test("validateFixtures: evidence must exist verbatim at file:line", () => {
  const root = mkdtempSync(join(tmpdir(), "fx-"));
  mkdirSync(join(root, "fixtures", "demo"), { recursive: true });
  mkdirSync(join(root, "expected"), { recursive: true });
  writeFileSync(join(root, "fixtures", "demo", "a.tsx"), "line1\nuseEffect(() => {\n  go();\n}, []);\n");
  const exp = (evidence, line = 2) => ({ ...goodReport, findings: [{ ...goodFinding, file: "a.tsx", line, evidence }] });
  writeFileSync(join(root, "expected", "demo.json"), JSON.stringify(exp("useEffect(() => {\n  go();\n}, []);")));
  assert.deepEqual(validateFixtures(root), []);
  writeFileSync(join(root, "expected", "demo.json"), JSON.stringify(exp("nope")));
  assert.ok(validateFixtures(root).some((e) => e.includes("evidence")));
  writeFileSync(join(root, "expected", "demo.json"), JSON.stringify(exp("useEffect(() => {\n  go();\n}, []);", 3)));
  assert.ok(validateFixtures(root).some((e) => e.includes("evidence")));
});

test("validateFixtures: every fixture needs an expected file", () => {
  const root = mkdtempSync(join(tmpdir(), "fx-"));
  mkdirSync(join(root, "fixtures", "orphan"), { recursive: true });
  mkdirSync(join(root, "expected"), { recursive: true });
  assert.ok(validateFixtures(root).some((e) => e.includes("orphan")));
});

test("checkEvidence accepts a verbatim excerpt of a line but not a wrong line", async () => {
  const { checkEvidence } = await import("../../scripts/validate.mjs");
  const dir = mkdtempSync(join(tmpdir(), "ce-"));
  writeFileSync(join(dir, "a.tsx"), "x\n  return <img src={src} />;\nmore\nuseEffect(() => {\n  go();\n});\n");
  const at = (line, evidence) => checkEvidence(dir, { file: "a.tsx", line, evidence });
  assert.deepEqual(at(2, "<img src={src} />"), []); // excerpt inside the line
  assert.deepEqual(at(2, "return <img src={src} />;"), []); // whole line
  assert.deepEqual(at(4, "useEffect(() => {\n  go();\n});"), []); // multi-line
  assert.ok(at(3, "<img src={src} />").length); // right text, wrong line
  assert.ok(at(2, "<img src={other} />").length); // invented text
  assert.ok(at(2, "").length); // empty evidence is not evidence
});
