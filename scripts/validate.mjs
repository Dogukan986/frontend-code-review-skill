#!/usr/bin/env node
// Deterministic, dependency-free checks. This is the only required CI gate.
// Usage: node scripts/validate.mjs
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateReportShape } from "./lib/schema.mjs";

const ALLOWED_FIELDS = ["name", "description", "license", "compatibility", "metadata", "allowed-tools"];
const RULE_SECTIONS = ["Look for", "Why", "Bad", "Good", "False-positive guard", "Default severity"];
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Minimal frontmatter reader: top-level keys; indented lines belong to the previous key. */
export function parseFrontmatter(text) {
  const m = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return null;
  const fields = {};
  let last = null;
  for (const line of m[1].split("\n")) {
    const top = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (top && !/^\s/.test(line)) {
      last = top[1];
      fields[last] = top[2];
    } else if (last && /^\s+\S/.test(line)) {
      fields[last] += (fields[last] ? "\n" : "") + line.trim();
    }
  }
  return { fields, body: text.slice(m[0].length) };
}

function markdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? markdownFiles(join(dir, e.name)) : e.name.endsWith(".md") ? [join(dir, e.name)] : [],
  );
}

const stripFences = (t) => t.replace(/```[\s\S]*?```/g, "");

function linksOf(text) {
  return [...stripFences(text).matchAll(/\]\(([^)\s]+)\)/g)]
    .map((m) => m[1].split("#")[0])
    .filter((l) => l && !/^[a-z][a-z0-9+.-]*:/i.test(l));
}

export function validateSkill(skillDir) {
  const errors = [];
  const skillFile = join(skillDir, "SKILL.md");
  if (!existsSync(skillFile)) return [`${skillFile} is missing`];
  const text = readFileSync(skillFile, "utf8");
  const parsed = parseFrontmatter(text);
  if (!parsed) return ["SKILL.md has no YAML frontmatter"];
  const { fields } = parsed;

  for (const key of Object.keys(fields)) {
    if (!ALLOWED_FIELDS.includes(key)) errors.push(`frontmatter field "${key}" is not part of the Agent Skills standard`);
  }
  const name = fields.name ?? "";
  if (!name) errors.push("frontmatter name is required");
  else {
    if (name.length > 64) errors.push("name must be at most 64 characters");
    if (!NAME_RE.test(name)) errors.push(`name "${name}" must be lowercase letters, digits and single hyphens, not starting or ending with a hyphen`);
    if (name !== basename(resolve(skillDir))) errors.push(`name "${name}" must match the parent directory "${basename(resolve(skillDir))}"`);
  }
  const description = fields.description ?? "";
  if (!description) errors.push("frontmatter description is required");
  else if (description.length > 1024) errors.push(`description is ${description.length} chars; the limit is 1024`);
  if (fields.compatibility && fields.compatibility.length > 500) errors.push("compatibility must be at most 500 characters");

  const lines = text.split("\n").length;
  if (lines > 500) errors.push(`SKILL.md has ${lines} lines; keep it under 500`);

  for (const link of linksOf(text)) {
    const segments = link.split("/").filter((s) => s && s !== ".");
    if (segments.length > 2) errors.push(`SKILL.md link "${link}" is deeper than one level`);
  }
  for (const file of markdownFiles(skillDir)) {
    for (const link of linksOf(readFileSync(file, "utf8"))) {
      if (!existsSync(resolve(dirname(file), link))) errors.push(`${file.slice(skillDir.length + 1)}: broken link "${link}"`);
    }
  }

  const refsDir = join(skillDir, "references");
  if (existsSync(refsDir)) {
    for (const f of readdirSync(refsDir).filter((n) => n.endsWith(".md"))) {
      const content = readFileSync(join(refsDir, f), "utf8");
      for (const section of content.split(/^## /m).slice(1)) {
        const id = section.split("\n")[0].trim();
        if (!id.includes("/")) continue; // only rule sections (e.g. hooks/stale-closure)
        for (const label of RULE_SECTIONS) {
          if (!section.includes(`**${label}:**`)) errors.push(`references/${f}: rule ${id} is missing "${label}"`);
        }
      }
    }
  }
  return errors;
}

/** Checks fixtures/<name>/ against expected/<name>.json under `root`. */
export function validateFixtures(root) {
  const errors = [];
  const fixturesDir = join(root, "fixtures");
  const expectedDir = join(root, "expected");
  if (!existsSync(fixturesDir)) return [`${fixturesDir} is missing`];
  for (const name of readdirSync(fixturesDir).filter((n) => statSync(join(fixturesDir, n)).isDirectory())) {
    const expectedFile = join(expectedDir, `${name}.json`);
    if (!existsSync(expectedFile)) {
      errors.push(`fixture "${name}" has no expected/${name}.json`);
      continue;
    }
    let report;
    try {
      report = JSON.parse(readFileSync(expectedFile, "utf8"));
    } catch (e) {
      errors.push(`expected/${name}.json is not valid JSON: ${e.message}`);
      continue;
    }
    errors.push(...validateReportShape(report).map((e) => `expected/${name}.json: ${e}`));
    for (const f of report.findings ?? []) {
      errors.push(...checkEvidence(join(fixturesDir, name), f).map((e) => `expected/${name}.json ${f.id}: ${e}`));
    }
    for (const s of report.suspicious_content ?? []) {
      if (!existsSync(join(fixturesDir, name, s.file ?? ""))) errors.push(`expected/${name}.json: suspicious_content file "${s.file}" not found`);
    }
  }
  return errors;
}

/**
 * Evidence must be a verbatim excerpt of the file starting at the claimed line: it may start or end
 * mid-line, and indentation and trailing whitespace are ignored. The same text on another line fails.
 */
export function checkEvidence(baseDir, finding) {
  const file = join(baseDir, finding.file ?? "");
  if (!existsSync(file)) return [`file "${finding.file}" not found`];
  const evidence = String(finding.evidence ?? "").replace(/\r\n/g, "\n").split("\n").map((l) => l.trim()).join("\n").trim();
  if (!evidence) return [`empty evidence at ${finding.file}:${finding.line}`];
  const fileLines = readFileSync(file, "utf8").replace(/\r\n/g, "\n").split("\n");
  const count = evidence.split("\n").length;
  const window = fileLines.slice(finding.line - 1, finding.line - 1 + count).map((l) => l.trim()).join("\n");
  return window.includes(evidence) ? [] : [`evidence not found verbatim at ${finding.file}:${finding.line}`];
}

function main() {
  const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const errors = [
    ...validateSkill(join(repo, "skills", "frontend-code-review")),
    ...validateFixtures(join(repo, "tests")),
  ];
  const examples = join(repo, "examples", "sample-report.json");
  if (existsSync(examples)) {
    errors.push(...validateReportShape(JSON.parse(readFileSync(examples, "utf8"))).map((e) => `examples/sample-report.json: ${e}`));
  }
  if (errors.length) {
    console.error(`validate: ${errors.length} problem(s)\n` + errors.map((e) => `  - ${e}`).join("\n"));
    process.exit(1);
  }
  console.log("validate: all checks passed");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
