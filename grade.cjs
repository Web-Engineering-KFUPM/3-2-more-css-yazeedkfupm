#!/usr/bin/env node
/**
 * Lab 3-2 More CSS — Autograder (grade.cjs)
 *
 * Scoring:
 * - TODO 1..8: 10 marks each (80 total)
 * - Submission: 20 marks (on-time=20, late=10, missing styles.css=0)
 *
 * Late due date: 09/10/2025 11:59 PM Riyadh (UTC+03:00)
 *
 * Important: We only check that the student implemented the required selectors and CSS properties.
 * We do NOT validate the values (colors, sizes, etc).
 *
 * Outputs:
 * - artifacts/grade.csv  (structure unchanged)
 * - artifacts/feedback/README.md
 * - GitHub Actions Step Summary (GITHUB_STEP_SUMMARY)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ARTIFACTS_DIR = "artifacts";
const FEEDBACK_DIR = path.join(ARTIFACTS_DIR, "feedback");
fs.mkdirSync(FEEDBACK_DIR, { recursive: true });

/** Late due date: 09/10/2025 11:59 PM Riyadh time (UTC+03:00)
 * Interpreting as 09 Oct 2025.
 */
const DUE_ISO = "2025-10-09T23:59:00+03:00";
const DUE_EPOCH_MS = Date.parse(DUE_ISO);

/** ---------- Git helpers (late submission) ---------- */
function getLatestCommitEpochMs() {
  try {
    const out = execSync("git log -1 --format=%ct", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    const seconds = Number(out);
    if (!Number.isFinite(seconds)) return null;
    return seconds * 1000;
  } catch {
    return null;
  }
}
function wasSubmittedLate() {
  const commitMs = getLatestCommitEpochMs();
  if (!commitMs) return false; // best-effort
  return commitMs > DUE_EPOCH_MS;
}
function getStudentId() {
  const repoFull = process.env.GITHUB_REPOSITORY || ""; // org/repo
  const repoName = repoFull.includes("/") ? repoFull.split("/")[1] : repoFull;

  // Classroom repos usually end with username
  const fromRepoSuffix = repoName && repoName.includes("-") ? repoName.split("-").slice(-1)[0] : "";

  return (
    process.env.STUDENT_USERNAME ||
    fromRepoSuffix ||
    process.env.GITHUB_ACTOR ||
    repoName ||
    "student"
  );
}

/** ---------- CSS parsing helpers (simple, top-level) ---------- */
function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}
function normalizeSelector(sel) {
  return sel.trim().replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ");
}
function parseCssRules(cssText) {
  const css = stripCssComments(cssText);
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  const rules = [];
  let match;
  while ((match = ruleRegex.exec(css)) !== null) {
    const selectorText = match[1] ?? "";
    const body = match[2] ?? "";
    const selectors = selectorText
      .split(",")
      .map((s) => normalizeSelector(s))
      .filter(Boolean);
    rules.push({ selectors, body });
  }
  return rules;
}
function findMatchingRules(rules, selectorQuery) {
  const q = normalizeSelector(selectorQuery);
  return rules.filter((r) => r.selectors.some((s) => s === q));
}
function bodyHasProperty(body, propName) {
  const re = new RegExp(`(^|[;\\s])${propName}\\s*:`, "i");
  return re.test(body);
}
function bodyHasAnyProperty(body, propNames) {
  return propNames.some((p) => bodyHasProperty(body, p));
}
function bodyHasCssVarDefinition(body, varNameNoDashes) {
  // checks for: --brand: ...;
  const re = new RegExp(`(^|[;\\s])--${varNameNoDashes}\\s*:`, "i");
  return re.test(body);
}

/**
 * Checks exact selector existence + required properties presence (values ignored).
 * Returns detailed "present" and "missing" property names.
 */
function checkSelectorProperties(rules, selectorQuery, props) {
  const matchedRules = findMatchingRules(rules, selectorQuery);
  if (matchedRules.length === 0) {
    return {
      selector: selectorQuery,
      foundRule: false,
      present: [],
      missing: props.slice(),
      presentCount: 0,
      totalCount: props.length,
    };
  }

  const present = [];
  const missing = [];
  for (const prop of props) {
    const ok = matchedRules.some((r) => bodyHasProperty(r.body, prop));
    if (ok) present.push(prop);
    else missing.push(prop);
  }

  return {
    selector: selectorQuery,
    foundRule: true,
    present,
    missing,
    presentCount: present.length,
    totalCount: props.length,
  };
}

/**
 * Checks selector existence + requires that at least ONE property from anyProps exists.
 * Used for "hover feedback" or "min width/flex-basis" type requirements.
 */
function checkSelectorAnyOf(rules, selectorQuery, anyProps, label = "any-of") {
  const matchedRules = findMatchingRules(rules, selectorQuery);
  if (matchedRules.length === 0) {
    return {
      selector: selectorQuery,
      foundRule: false,
      present: [],
      missing: [`${label}: ${anyProps.join(" OR ")}`],
      presentCount: 0,
      totalCount: 1,
    };
  }
  const ok = matchedRules.some((r) => bodyHasAnyProperty(r.body, anyProps));
  return {
    selector: selectorQuery,
    foundRule: true,
    present: ok ? [`${label}: (${anyProps.join(" OR ")})`] : [],
    missing: ok ? [] : [`${label}: ${anyProps.join(" OR ")}`],
    presentCount: ok ? 1 : 0,
    totalCount: 1,
  };
}

/**
 * Checks :root for CSS variable definitions, values ignored.
 */
function checkRootVars(rules, varNamesNoDashes) {
  const selectorQuery = ":root";
  const matchedRules = findMatchingRules(rules, selectorQuery);
  if (matchedRules.length === 0) {
    return {
      selector: selectorQuery,
      foundRule: false,
      present: [],
      missing: varNamesNoDashes.map((v) => `--${v}`),
      presentCount: 0,
      totalCount: varNamesNoDashes.length,
    };
  }

  const present = [];
  const missing = [];
  for (const v of varNamesNoDashes) {
    const ok = matchedRules.some((r) => bodyHasCssVarDefinition(r.body, v));
    if (ok) present.push(`--${v}`);
    else missing.push(`--${v}`);
  }

  return {
    selector: selectorQuery,
    foundRule: true,
    present,
    missing,
    presentCount: present.length,
    totalCount: varNamesNoDashes.length,
  };
}

function scoreFromChecks(checks, maxMarks) {
  const totalReq = checks.reduce((s, c) => s + c.totalCount, 0);
  const presentReq = checks.reduce((s, c) => s + c.presentCount, 0);
  if (totalReq === 0) return { earned: 0, presentReq: 0 };
  return { earned: Math.round((maxMarks * presentReq) / totalReq), presentReq };
}

function buildTaskFeedback(checks) {
  // For transparency: show implemented and missed per selector
  const lines = [];
  for (const c of checks) {
    const sel = normalizeSelector(c.selector);
    if (!c.foundRule) {
      lines.push(`- ❌ Missing rule for selector \`${sel}\``);
      if (c.missing.length > 0) lines.push(`  - Required: ${c.missing.join(", ")}`);
      continue;
    }

    const present = c.present || [];
    const missing = c.missing || [];

    lines.push(`- ✅ Selector \`${sel}\``);
    lines.push(`  - Implemented: ${present.length ? present.join(", ") : "—"}`);
    lines.push(`  - Missing: ${missing.length ? missing.join(", ") : "—"}`);
  }
  return lines;
}

/** ---------- Load styles.css ---------- */
const cssPath = "styles.css";
const studentId = getStudentId();

const hasStyles = fs.existsSync(cssPath);
let cssText = "";
let cssLoadNote = "";

if (!hasStyles) {
  cssLoadNote = "❌ Missing `styles.css` → tasks cannot be detected (0/80).";
} else {
  cssText = fs.readFileSync(cssPath, "utf8");
  cssLoadNote = "✅ Found `styles.css`.";
}

const rules = cssText ? parseCssRules(cssText) : [];

/** ---------- Lab 3-2 Tasks (TODOs) ---------- */
const tasks = [
  {
    id: "TODO 1",
    name: "CSS Variables + Global Box-Sizing Reset",
    marks: 10,
    checks: () => [
      // Variables for later TODOs: brand/card/muted (values ignored)
      checkRootVars(rules, ["brand", "card", "muted"]),
      // Global reset
      checkSelectorProperties(rules, "*", ["box-sizing"]),
    ],
  },
  {
    id: "TODO 2",
    name: "Header/Footer Card Background + Tagline + Card Shadow",
    marks: 10,
    checks: () => [
      checkSelectorAnyOf(rules, ".site-header", ["background", "background-color"], "background"),
      checkSelectorAnyOf(rules, ".site-footer", ["background", "background-color"], "background"),
      checkSelectorProperties(rules, ".tagline", ["color"]),
      checkSelectorProperties(rules, ".card", ["box-shadow"]),
    ],
  },
  {
    id: "TODO 3",
    name: "Color Demo + Background Sample Block",
    marks: 10,
    checks: () => [
      checkSelectorProperties(rules, ".color-demo .color-note", ["color", "font-weight"]),
      checkSelectorProperties(rules, ".color-demo .muted", ["color", "font-size"]),
      checkSelectorProperties(rules, ".bg-sample", ["width", "min-height", "background-color"]),
    ],
  },
  {
    id: "TODO 4",
    name: "Inline Label Variations",
    marks: 10,
    checks: () => [
      checkSelectorProperties(rules, ".inline-label", ["display", "padding", "border"]),
      // "Different border style" — accept border-style OR border (top-level check)
      checkSelectorAnyOf(rules, ".inline-label.alt", ["border-style", "border"], "border style"),
    ],
  },
  {
    id: "TODO 5",
    name: "Typography + CTA Link Hover",
    marks: 10,
    checks: () => [
      checkSelectorProperties(rules, ".copy .title", ["font-size", "font-weight", "text-transform"]),
      checkSelectorProperties(rules, ".copy .intro", ["font-style", "line-height"]),
      checkSelectorProperties(rules, ".copy .sample-text", ["font-family", "font-size"]),
      checkSelectorProperties(rules, ".cta-link", ["text-decoration", "color"]),
      checkSelectorAnyOf(rules, ".cta-link:hover", ["text-decoration", "color"], "hover style"),
    ],
  },
  {
    id: "TODO 6",
    name: "Box Model + Flex Centering + Variants",
    marks: 10,
    checks: () => [
      checkSelectorProperties(rules, ".box", [
        "width",
        "height",
        "padding",
        "border",
        "border-radius",
        "display",
        "align-items",
        "justify-content",
      ]),
      // Unique style per box variant (background or border changes)
      checkSelectorAnyOf(rules, ".b1", ["background", "background-color", "border", "border-style"], "unique style"),
      checkSelectorAnyOf(rules, ".b2", ["background", "background-color", "border", "border-style"], "unique style"),
      checkSelectorAnyOf(rules, ".b3", ["background", "background-color", "border", "border-style"], "unique style"),
    ],
  },
  {
    id: "TODO 7",
    name: "Flex Toolbar + Buttons + Responsive Product Grid",
    marks: 10,
    checks: () => [
      checkSelectorProperties(rules, ".toolbar", ["display", "justify-content", "align-items", "gap"]),
      checkSelectorProperties(rules, ".btn", ["padding", "border"]),
      // Hover feedback: accept any of these
      checkSelectorAnyOf(rules, ".btn:hover", ["background", "background-color", "color", "opacity", "transform", "box-shadow"], "hover feedback"),
      checkSelectorProperties(rules, ".product-grid", ["display", "flex-wrap", "gap"]),
      // At least 140px wide: accept flex-basis OR min-width OR flex
      checkSelectorAnyOf(rules, ".product-grid", ["flex-basis", "min-width", "flex"], "min item width"),
      checkSelectorProperties(rules, ".product-grid .item", ["min-height", "background-color"]),
      // Center content (simple top-level check): accept text-align OR (display+align/justify)
      checkSelectorAnyOf(rules, ".product-grid .item", ["text-align", "display", "justify-content", "align-items"], "center content"),
    ],
  },
  {
    id: "TODO 8",
    name: "Positioning + Fixed Badge + Stacking (z-index)",
    marks: 10,
    checks: () => [
      checkSelectorProperties(rules, ".static-box", ["border", "padding"]),
      checkSelectorProperties(rules, ".relative-box", ["position", "top", "left"]),
      checkSelectorProperties(rules, ".absolute-parent", ["position", "background", "padding"]),
      checkSelectorProperties(rules, ".absolute-child", ["position", "top", "right"]),
      checkSelectorProperties(rules, ".fixed-badge", ["position", "bottom", "right", "padding", "background", "border-radius"]),
      // Overlapping squares base
      checkSelectorProperties(rules, ".stack", ["width", "height"]),
      checkSelectorAnyOf(rules, ".stack", ["position"], "positioning"),
      // Stacking order
      checkSelectorProperties(rules, ".stack.a", ["background-color", "z-index"]),
      checkSelectorProperties(rules, ".stack.b", ["background-color", "z-index"]),
      // Offset slightly
      checkSelectorAnyOf(rules, ".stack.b", ["top", "left", "transform"], "offset"),
    ],
  },
];

/** ---------- Grade tasks ---------- */
let earnedTasks = 0;
let presentReqAcrossAll = 0;

const taskResults = tasks.map((t) => {
  const checks = t.checks();
  const { earned, presentReq } = scoreFromChecks(checks, t.marks);

  earnedTasks += hasStyles ? earned : 0;
  presentReqAcrossAll += presentReq;

  const feedbackLines = hasStyles ? buildTaskFeedback(checks) : [cssLoadNote];

  return {
    id: t.id,
    name: t.name,
    earned: hasStyles ? earned : 0,
    max: t.marks,
    feedbackLines,
  };
});

/** ---------- Status + submission marks ---------- */
const late = wasSubmittedLate();
let status = late ? 1 : 0;

// status=2: submitted but implemented none of the required checks
if (hasStyles && presentReqAcrossAll === 0) {
  status = 2;
}

const submissionMarks = hasStyles ? (late ? 10 : 20) : 0;
const submissionStatusText = hasStyles
  ? late
    ? "Late submission detected via latest commit time: 10/20."
    : "On-time submission via latest commit time: 20/20."
  : "No `styles.css` found: submission marks = 0/20.";

const totalEarned = Math.min(earnedTasks + submissionMarks, 100);

/** ---------- Build summary for GitHub Actions tab ---------- */
const now = new Date().toISOString();
let summary = `# Lab | 3-2 More CSS | Autograding Summary

- Student: \`${studentId}\`
- ${cssLoadNote}
- ${submissionStatusText}
- Late Due (Riyadh): \`${DUE_ISO}\`
- Status: **${status}** (0=on time, 1=late, 2=submitted but no tasks implemented)
- Run: \`${now}\`

## Marks Breakdown

| Item | Marks |
|------|------:|
`;

for (const tr of taskResults) {
  summary += `| ${tr.id}: ${tr.name} | ${tr.earned}/${tr.max} |\n`;
}
summary += `| Submission | ${submissionMarks}/20 |\n`;

summary += `
## Total Marks

**${totalEarned} / 100**

## Detailed Feedback (Implemented vs Missed)
`;

for (const tr of taskResults) {
  summary += `\n### ${tr.id}: ${tr.name}\n`;
  summary += tr.feedbackLines.join("\n") + "\n";
}

if (status === 2) {
  summary += `\n⚠️ **Status=2:** Your submission was detected, but none of the required selectors/properties for the lab tasks were found.\n`;
}

/** ---------- Write outputs ---------- */
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}

fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

/** DO NOT change CSV structure */
const csv = `student_username,obtained_marks,total_marks,status
${studentId},${totalEarned},100,${status}
`;

fs.writeFileSync(path.join(ARTIFACTS_DIR, "grade.csv"), csv);
fs.writeFileSync(path.join(FEEDBACK_DIR, "README.md"), summary);

console.log(`✔ Lab graded: ${totalEarned}/100 (status=${status})`);