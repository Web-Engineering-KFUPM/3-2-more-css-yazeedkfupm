#!/usr/bin/env node
/**
 * Lab 3.2 More CSS — Autograder (grade.cjs)
 *
 * Scoring:
 * - TODO 1..7 (7 TODOs): 10 marks each, except TODO 7 = 20 marks
 *   - TODO marks total = 80
 * - Submission: 20 marks (on-time=20, late=10, missing/empty CSS=0)
 * - Total = 100
 *
 * IMPORTANT (late check):
 * - We grade lateness using the latest *student* commit (non-bot),
 *   NOT the latest workflow/GitHub Actions commit.
 *
 * Status codes:
 * - 0 = on time
 * - 1 = late
 * - 2 = no submission OR empty CSS file
 *
 * Outputs:
 * - artifacts/grade.csv  (structure unchanged)
 * - artifacts/feedback/README.md
 * - GitHub Actions Step Summary (GITHUB_STEP_SUMMARY)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const LAB_NAME = "3.2 More CSS";

const ARTIFACTS_DIR = "artifacts";
const FEEDBACK_DIR = path.join(ARTIFACTS_DIR, "feedback");
fs.mkdirSync(FEEDBACK_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

/** Due date (keep/update as needed). Riyadh time (UTC+03:00) */
const DUE_ISO = "2025-10-09T23:59:00+03:00";
const DUE_EPOCH_MS = Date.parse(DUE_ISO);

const TODO_BUCKET_MAX = 80;
const SUBMISSION_MAX = 20;
const TOTAL_MAX = 100;

const CSS_FILE_DEFAULT = "styles.css";

/** ---------- Student ID ---------- */
function getStudentId() {
  const repoFull = process.env.GITHUB_REPOSITORY || ""; // org/repo
  const repoName = repoFull.includes("/") ? repoFull.split("/")[1] : repoFull;

  const fromRepoSuffix =
    repoName && repoName.includes("-") ? repoName.split("-").slice(-1)[0] : "";

  return (
    process.env.STUDENT_USERNAME ||
    fromRepoSuffix ||
    process.env.GITHUB_ACTOR ||
    repoName ||
    "student"
  );
}

/** ---------- Git helpers: latest *student* commit time (exclude bots/workflows) ---------- */
function getLatestStudentCommitEpochMs() {
  try {
    const out = execSync('git log --format=%ct|%an|%ae|%cn|%ce|%s -n 300', {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();

    if (!out) return null;

    const lines = out.split("\n");
    for (const line of lines) {
      const parts = line.split("|");
      const ct = parts[0];
      const an = parts[1] || "";
      const ae = parts[2] || "";
      const cn = parts[3] || "";
      const ce = parts[4] || "";
      const subject = parts.slice(5).join("|") || "";

      const hay = `${an} ${ae} ${cn} ${ce} ${subject}`.toLowerCase();

      const isBot =
        hay.includes("[bot]") ||
        hay.includes("github-actions") ||
        hay.includes("actions@github.com") ||
        hay.includes("github classroom") ||
        hay.includes("classroom[bot]") ||
        hay.includes("dependabot") ||
        hay.includes("autograding") ||
        hay.includes("workflow");

      if (isBot) continue;

      const seconds = Number(ct);
      if (!Number.isFinite(seconds)) continue;
      return seconds * 1000;
    }

    // Fallback: latest commit time
    const fallback = execSync("git log -1 --format=%ct", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    const seconds = Number(fallback);
    return Number.isFinite(seconds) ? seconds * 1000 : null;
  } catch {
    return null;
  }
}

function wasSubmittedLate() {
  const commitMs = getLatestStudentCommitEpochMs();
  if (!commitMs) return false; // best-effort
  return commitMs > DUE_EPOCH_MS;
}

/** ---------- File helpers ---------- */
function readTextSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

/** ---------- HTML helpers (to discover linked CSS) ---------- */
function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

function findCssHrefs(html) {
  const h = stripHtmlComments(html);
  const re =
    /<link\b[^>]*\brel\s*=\s*["']stylesheet["'][^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
  const hrefs = [];
  let m;
  while ((m = re.exec(h)) !== null) hrefs.push(m[1]);
  return hrefs;
}

function resolveFromIndex(ref, indexPath) {
  const base = path.dirname(indexPath);
  if (/^https?:\/\//i.test(ref)) return null;
  const cleaned = ref.replace(/^\//, "");
  return path.normalize(path.join(base, cleaned));
}

function guessCssFileFromRepo() {
  const candidates = [CSS_FILE_DEFAULT, "style.css", "main.css", "app.css", "index.css"];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  const entries = fs.readdirSync(".", { withFileTypes: true });
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (!e.name.toLowerCase().endsWith(".css")) continue;
    if (e.name.toLowerCase().includes("node_modules")) continue;
    if (e.name.toLowerCase().includes("artifacts")) continue;
    return e.name;
  }
  return null;
}

/** ---------- CSS parsing helpers (flexible) ---------- */
function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}
function compactWs(s) {
  return s.replace(/\s+/g, " ").trim();
}
function isEmptyCss(css) {
  const stripped = compactWs(stripCssComments(css));
  return stripped.length < 10;
}

function normalizeSelector(s) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}
function normalizeDecls(s) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function parseCssRules(cssText) {
  const css = stripCssComments(cssText);
  const rules = [];
  const re = /([^{}]+)\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const selectorRaw = m[1];
    const declRaw = m[2];
    const selectorList = selectorRaw
      .split(",")
      .map((x) => normalizeSelector(x))
      .filter(Boolean);
    const decls = normalizeDecls(declRaw);
    for (const sel of selectorList) rules.push({ selector: sel, decls });
  }
  return rules;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function declsHasAnyProperty(decls, propNames) {
  return propNames.some((p) => new RegExp(`\\b${escapeRegExp(p)}\\s*:`, "i").test(decls));
}
function findMatchingRules(rules, selectorMatcher) {
  if (typeof selectorMatcher === "string") {
    const target = normalizeSelector(selectorMatcher);
    return rules.filter((r) => r.selector === target);
  }
  if (selectorMatcher instanceof RegExp) return rules.filter((r) => selectorMatcher.test(r.selector));
  if (typeof selectorMatcher === "function") return rules.filter((r) => selectorMatcher(r.selector));
  return [];
}
function ruleSatisfies(rules, selectorMatcher, { anyProps = [], mustInclude = [] } = {}) {
  const matches = findMatchingRules(rules, selectorMatcher);
  if (!matches.length) return false;
  return matches.some((r) => {
    const d = r.decls;
    const okAny = anyProps.length ? declsHasAnyProperty(d, anyProps) : true;
    const okInclude = mustInclude.length ? mustInclude.every((x) => d.includes(String(x).toLowerCase())) : true;
    return okAny && okInclude;
  });
}

/** Related properties accepted (don’t check values) */
const RELATED = {
  // variables
  customProp: ["--"], // checked via mustInclude for specific vars

  // universal/base
  boxSizing: ["box-sizing"],

  // layout shell
  textAlign: ["text-align"],
  padding: ["padding", "padding-inline", "padding-block", "padding-top", "padding-right", "padding-bottom", "padding-left"],
  background: ["background", "background-color"],
  border: ["border", "border-color", "border-width", "border-style"],
  borderRadius: ["border-radius"],
  boxShadow: ["box-shadow", "filter"], // filter (drop-shadow) accepted as alternative

  // typography/text
  color: ["color"],
  fontSize: ["font-size", "font"],
  fontWeight: ["font-weight", "font"],
  fontStyle: ["font-style", "font"],
  lineHeight: ["line-height", "font"],
  fontFamily: ["font-family", "font"],
  textTransform: ["text-transform"],
  textDecoration: ["text-decoration", "text-decoration-line", "text-decoration-style", "text-decoration-thickness"],

  // sizing/layout
  width: ["width", "max-width", "min-width", "inline-size"],
  height: ["height", "max-height", "min-height", "block-size"],
  display: ["display"],
  placeItems: ["place-items", "align-items", "justify-items"],
  justifyContent: ["justify-content"],
  alignItems: ["align-items"],
  gap: ["gap", "row-gap", "column-gap"],
  flexWrap: ["flex-wrap"],
  flex: ["flex", "flex-basis", "flex-grow", "flex-shrink"],

  // positioning
  position: ["position"],
  offset: ["top", "right", "bottom", "left", "inset", "inset-inline", "inset-block"],
  zIndex: ["z-index"],

  // cursor/hover
  cursor: ["cursor"],
};

/** ---------- Requirement scoring ---------- */
function req(label, ok, detailIfFail = "") {
  return { label, ok: !!ok, detailIfFail };
}
function scoreFromRequirements(reqs) {
  const total = reqs.length;
  const ok = reqs.filter((r) => r.ok).length;
  return { ok, total, fraction: total ? ok / total : 0 };
}
function formatReqs(reqs) {
  return reqs.map((r) => (r.ok ? `- ✅ ${r.label}` : `- ❌ ${r.label}${r.detailIfFail ? ` — ${r.detailIfFail}` : ""}`));
}

/** ---------- Locate files ---------- */
const studentId = getStudentId();

const indexPath = "index.html";
const hasIndex = fs.existsSync(indexPath);
const indexHtml = hasIndex ? readTextSafe(indexPath) : "";

let linkedCss = null;
if (hasIndex) {
  const hrefs = findCssHrefs(indexHtml);
  for (const href of hrefs) {
    const resolved = resolveFromIndex(href, indexPath);
    if (resolved && fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      linkedCss = resolved;
      break;
    }
  }
}
if (!linkedCss) linkedCss = fs.existsSync(CSS_FILE_DEFAULT) ? CSS_FILE_DEFAULT : guessCssFileFromRepo();

const hasCss = !!(linkedCss && fs.existsSync(linkedCss));
const cssCode = hasCss ? readTextSafe(linkedCss) : "";
const cssEmpty = hasCss ? isEmptyCss(cssCode) : true;

const cssLoadNote = hasCss
  ? cssEmpty
    ? `⚠️ Found \`${linkedCss}\` but it appears empty (or only comments).`
    : `✅ Found \`${linkedCss}\`.`
  : `❌ No CSS file found (expected \`${CSS_FILE_DEFAULT}\` or a stylesheet linked from index.html).`;

/** ---------- Submission status + marks ---------- */
const late = wasSubmittedLate();
let status = 0;
if (!hasCss || cssEmpty) status = 2;
else status = late ? 1 : 0;

const submissionMarks = status === 2 ? 0 : status === 1 ? 10 : 20;

const commitMs = getLatestStudentCommitEpochMs();
const commitIso = commitMs ? new Date(commitMs).toISOString() : "unknown";

const submissionStatusText =
  status === 2
    ? "No submission detected (missing/empty CSS): submission marks = 0/20."
    : status === 1
    ? `Late submission detected via latest *student* commit time: 10/20. (student commit: ${commitIso})`
    : `On-time submission via latest *student* commit time: 20/20. (student commit: ${commitIso})`;

/** ---------- Parse CSS rules ---------- */
const rules = hasCss && !cssEmpty ? parseCssRules(cssCode) : [];

/** ---------- TODO Checks (7 TODOs) ---------- */
const todoMarks = {
  "TODO 1": 10,
  "TODO 2": 10,
  "TODO 3": 10,
  "TODO 4": 10,
  "TODO 5": 10,
  "TODO 6": 10,
  "TODO 7": 20,
};

const tasks = [
  {
    id: "TODO 1",
    name: "Base & Variables (:root vars + * box-sizing)",
    marks: 10,
    requirements: () => {
      const reqs = [];

      reqs.push(req('Has a ":root { ... }" rule', findMatchingRules(rules, ":root").length > 0, "Add :root {}."));

      // Check that variables exist (don’t check values)
      const rootRules = findMatchingRules(rules, ":root");
      const rootDecls = rootRules.map((r) => r.decls).join(" ");
      const hasBrand = rootDecls.includes("--brand");
      const hasMuted = rootDecls.includes("--muted");
      const hasBg = rootDecls.includes("--bg");
      const hasCard = rootDecls.includes("--card");

      reqs.push(req("Defines CSS variable --brand", hasBrand, "Add --brand: ..."));
      reqs.push(req("Defines CSS variable --muted", hasMuted, "Add --muted: ..."));
      reqs.push(req("Defines CSS variable --bg", hasBg, "Add --bg: ..."));
      reqs.push(req("Defines CSS variable --card", hasCard, "Add --card: ..."));

      reqs.push(req('Has a universal selector "* { ... }" rule', findMatchingRules(rules, "*").length > 0, "Add * {}."));
      reqs.push(
        req(
          "* rule includes box-sizing",
          ruleSatisfies(rules, "*", { anyProps: RELATED.boxSizing }),
          "Use box-sizing: ..."
        )
      );

      return reqs;
    },
  },
  {
    id: "TODO 2",
    name: "Layout Shell (.site-header/.site-footer, .tagline, .card)",
    marks: 10,
    requirements: () => {
      const reqs = [];

      // grouped selector might be split by parser into two selectors; accept either or both
      const hasHeader = findMatchingRules(rules, ".site-header").length > 0;
      const hasFooter = findMatchingRules(rules, ".site-footer").length > 0;
      reqs.push(req("Has .site-header rule", hasHeader, "Add .site-header { ... }."));
      reqs.push(req("Has .site-footer rule", hasFooter, "Add .site-footer { ... }."));

      const bgOk =
        ruleSatisfies(rules, ".site-header", { anyProps: RELATED.background }) ||
        ruleSatisfies(rules, ".site-footer", { anyProps: RELATED.background });

      reqs.push(req("Header/footer include a background property (background or background-color)", bgOk, "Use background/background-color."));

      reqs.push(req("Has .tagline rule", findMatchingRules(rules, ".tagline").length > 0, "Add .tagline { ... }."));
      reqs.push(
        req(
          ".tagline includes a color property",
          ruleSatisfies(rules, ".tagline", { anyProps: RELATED.color }),
          "Use color: ..."
        )
      );

      reqs.push(req("Has .card rule", findMatchingRules(rules, ".card").length > 0, "Add .card { ... }."));
      reqs.push(
        req(
          ".card includes a box-shadow-like property (box-shadow or filter drop-shadow)",
          ruleSatisfies(rules, ".card", { anyProps: RELATED.boxShadow }),
          "Use box-shadow (or filter: drop-shadow)."
        )
      );

      return reqs;
    },
  },
  {
    id: "TODO 3",
    name: "Common Properties (color-demo, bg-sample, inline labels)",
    marks: 10,
    requirements: () => {
      const reqs = [];

      reqs.push(req("Has .color-demo .color-note rule", findMatchingRules(rules, ".color-demo .color-note").length > 0));
      reqs.push(
        req(
          ".color-demo .color-note includes color",
          ruleSatisfies(rules, ".color-demo .color-note", { anyProps: RELATED.color }),
          "Use color: ..."
        )
      );
      reqs.push(
        req(
          ".color-demo .color-note includes font-weight",
          ruleSatisfies(rules, ".color-demo .color-note", { anyProps: RELATED.fontWeight }),
          "Use font-weight: ..."
        )
      );

      reqs.push(req("Has .color-demo .muted rule", findMatchingRules(rules, ".color-demo .muted").length > 0));
      reqs.push(
        req(
          ".color-demo .muted includes color",
          ruleSatisfies(rules, ".color-demo .muted", { anyProps: RELATED.color }),
          "Use color: ..."
        )
      );
      reqs.push(
        req(
          ".color-demo .muted includes font-size (or font shorthand)",
          ruleSatisfies(rules, ".color-demo .muted", { anyProps: RELATED.fontSize }),
          "Use font-size or font."
        )
      );

      reqs.push(req("Has .bg-sample rule", findMatchingRules(rules, ".bg-sample").length > 0));
      reqs.push(req(".bg-sample sets width (or equivalent)", ruleSatisfies(rules, ".bg-sample", { anyProps: RELATED.width }), "Use width/inline-size."));
      reqs.push(
        req(
          ".bg-sample sets min-height/height (or equivalent)",
          ruleSatisfies(rules, ".bg-sample", { anyProps: ["min-height", ...RELATED.height] }),
          "Use min-height/height/block-size."
        )
      );
      reqs.push(
        req(
          ".bg-sample uses a background property (background or background-color)",
          ruleSatisfies(rules, ".bg-sample", { anyProps: RELATED.background }),
          "Use background/background-color."
        )
      );

      reqs.push(req("Has .inline-label rule", findMatchingRules(rules, ".inline-label").length > 0));
      reqs.push(req(".inline-label sets display", ruleSatisfies(rules, ".inline-label", { anyProps: RELATED.display }), "Use display: ..."));
      reqs.push(req(".inline-label sets padding", ruleSatisfies(rules, ".inline-label", { anyProps: RELATED.padding }), "Use padding: ..."));
      reqs.push(req(".inline-label sets border", ruleSatisfies(rules, ".inline-label", { anyProps: RELATED.border }), "Use border: ..."));

      reqs.push(req("Has .inline-label.alt rule", findMatchingRules(rules, ".inline-label.alt").length > 0));
      reqs.push(req(".inline-label.alt sets border (dashed or otherwise)", ruleSatisfies(rules, ".inline-label.alt", { anyProps: RELATED.border }), "Use border: ..."));
      reqs.push(req(".inline-label.alt sets display", ruleSatisfies(rules, ".inline-label.alt", { anyProps: RELATED.display }), "Use display: ..."));

      return reqs;
    },
  },
  {
    id: "TODO 4",
    name: "Fonts & Text (.copy and .cta-link)",
    marks: 10,
    requirements: () => {
      const reqs = [];

      reqs.push(req("Has .copy .title rule", findMatchingRules(rules, ".copy .title").length > 0));
      reqs.push(req(".copy .title sets font-size", ruleSatisfies(rules, ".copy .title", { anyProps: RELATED.fontSize }), "Use font-size/font."));
      reqs.push(req(".copy .title sets font-weight", ruleSatisfies(rules, ".copy .title", { anyProps: RELATED.fontWeight }), "Use font-weight/font."));
      reqs.push(req(".copy .title sets text-transform", ruleSatisfies(rules, ".copy .title", { anyProps: RELATED.textTransform }), "Use text-transform."));

      reqs.push(req("Has .copy .intro rule", findMatchingRules(rules, ".copy .intro").length > 0));
      reqs.push(req(".copy .intro sets font-style", ruleSatisfies(rules, ".copy .intro", { anyProps: RELATED.fontStyle }), "Use font-style/font."));
      reqs.push(req(".copy .intro sets line-height", ruleSatisfies(rules, ".copy .intro", { anyProps: RELATED.lineHeight }), "Use line-height/font."));

      reqs.push(req("Has .copy .sample-text rule", findMatchingRules(rules, ".copy .sample-text").length > 0));
      reqs.push(req(".copy .sample-text sets font-family", ruleSatisfies(rules, ".copy .sample-text", { anyProps: RELATED.fontFamily }), "Use font-family/font."));
      reqs.push(req(".copy .sample-text sets font-size", ruleSatisfies(rules, ".copy .sample-text", { anyProps: RELATED.fontSize }), "Use font-size/font."));

      reqs.push(req("Has .cta-link rule", findMatchingRules(rules, ".cta-link").length > 0));
      reqs.push(req(".cta-link sets color", ruleSatisfies(rules, ".cta-link", { anyProps: RELATED.color }), "Use color."));
      reqs.push(req(".cta-link sets text-decoration", ruleSatisfies(rules, ".cta-link", { anyProps: RELATED.textDecoration }), "Use text-decoration (or related)."));

      // hover styles (flexible: either underline or color change etc.)
      reqs.push(req("Has .cta-link:hover rule", findMatchingRules(rules, ".cta-link:hover").length > 0, "Add hover styling."));

      return reqs;
    },
  },
  {
    id: "TODO 5",
    name: "Box Model (.box + .b1/.b2/.b3)",
    marks: 10,
    requirements: () => {
      const reqs = [];

      reqs.push(req("Has .box rule", findMatchingRules(rules, ".box").length > 0));
      reqs.push(req(".box sets width", ruleSatisfies(rules, ".box", { anyProps: RELATED.width }), "Use width/inline-size."));
      reqs.push(req(".box sets height/min-height", ruleSatisfies(rules, ".box", { anyProps: ["min-height", ...RELATED.height] }), "Use height/min-height/block-size."));
      reqs.push(req(".box sets padding", ruleSatisfies(rules, ".box", { anyProps: RELATED.padding }), "Use padding."));
      reqs.push(req(".box sets border", ruleSatisfies(rules, ".box", { anyProps: RELATED.border }), "Use border."));
      reqs.push(req(".box sets border-radius", ruleSatisfies(rules, ".box", { anyProps: RELATED.borderRadius }), "Use border-radius."));

      // flex centering: accept flex+align-items+justify-content OR grid+place-items
      const flexCenter =
        ruleSatisfies(rules, ".box", { anyProps: ["display"] }) &&
        (ruleSatisfies(rules, ".box", { anyProps: RELATED.alignItems }) &&
          ruleSatisfies(rules, ".box", { anyProps: RELATED.justifyContent }));

      const gridCenter =
        ruleSatisfies(rules, ".box", { anyProps: ["display"] }) &&
        ruleSatisfies(rules, ".box", { anyProps: RELATED.placeItems });

      reqs.push(req(".box uses a centering approach (flex align/justify OR place-items)", flexCenter || gridCenter, "Center content using flex or grid."));

      reqs.push(req("Has .b1 rule", findMatchingRules(rules, ".b1").length > 0));
      reqs.push(req("Has .b2 rule", findMatchingRules(rules, ".b2").length > 0));
      reqs.push(req("Has .b3 rule", findMatchingRules(rules, ".b3").length > 0));

      return reqs;
    },
  },
  {
    id: "TODO 6",
    name: "Flexbox (.toolbar, .btn, .product-grid, .product-grid .item)",
    marks: 10,
    requirements: () => {
      const reqs = [];

      reqs.push(req("Has .toolbar rule", findMatchingRules(rules, ".toolbar").length > 0));
      reqs.push(req(".toolbar sets display", ruleSatisfies(rules, ".toolbar", { anyProps: RELATED.display }), "Use display."));
      reqs.push(req(".toolbar uses justify-content", ruleSatisfies(rules, ".toolbar", { anyProps: RELATED.justifyContent }), "Use justify-content."));
      reqs.push(req(".toolbar uses align-items", ruleSatisfies(rules, ".toolbar", { anyProps: RELATED.alignItems }), "Use align-items."));
      reqs.push(req(".toolbar uses gap", ruleSatisfies(rules, ".toolbar", { anyProps: RELATED.gap }), "Use gap."));

      reqs.push(req("Has .btn rule", findMatchingRules(rules, ".btn").length > 0));
      reqs.push(req(".btn sets padding", ruleSatisfies(rules, ".btn", { anyProps: RELATED.padding }), "Use padding."));
      reqs.push(req("Has .btn:hover rule (hover effect)", findMatchingRules(rules, ".btn:hover").length > 0, "Add hover styles."));

      reqs.push(req("Has .product-grid rule", findMatchingRules(rules, ".product-grid").length > 0));
      reqs.push(req(".product-grid sets display", ruleSatisfies(rules, ".product-grid", { anyProps: RELATED.display }), "Use display."));
      reqs.push(req(".product-grid uses flex-wrap", ruleSatisfies(rules, ".product-grid", { anyProps: RELATED.flexWrap }), "Use flex-wrap."));
      reqs.push(req(".product-grid uses gap", ruleSatisfies(rules, ".product-grid", { anyProps: RELATED.gap }), "Use gap."));

      reqs.push(req("Has .product-grid .item rule", findMatchingRules(rules, ".product-grid .item").length > 0));
      reqs.push(req(".product-grid .item sets min-height/height", ruleSatisfies(rules, ".product-grid .item", { anyProps: ["min-height", ...RELATED.height] }), "Use min-height/height."));
      reqs.push(req(".product-grid .item sets background", ruleSatisfies(rules, ".product-grid .item", { anyProps: RELATED.background }), "Use background/background-color."));
      reqs.push(
        req(
          ".product-grid .item centers content (place-items OR align/justify)",
          ruleSatisfies(rules, ".product-grid .item", { anyProps: RELATED.placeItems }) ||
            (ruleSatisfies(rules, ".product-grid .item", { anyProps: RELATED.alignItems }) &&
              ruleSatisfies(rules, ".product-grid .item", { anyProps: RELATED.justifyContent })),
          "Center item content."
        )
      );
      reqs.push(
        req(
          ".product-grid .item uses flex properties (flex or flex-basis)",
          ruleSatisfies(rules, ".product-grid .item", { anyProps: RELATED.flex }),
          "Use flex or flex-basis."
        )
      );

      return reqs;
    },
  },
  {
    id: "TODO 7",
    name: "Positioning & Stacking (position, offsets, z-index)",
    marks: 20,
    requirements: () => {
      const reqs = [];

      // selectors must exist
      const selList = [
        ".static-box",
        ".relative-box",
        ".absolute-parent",
        ".absolute-child",
        ".fixed-badge",
        ".stack",
        ".stack.a",
        ".stack.b",
      ];
      for (const s of selList) reqs.push(req(`Has "${s}" rule`, findMatchingRules(rules, s).length > 0, `Add ${s} { ... }.`));

      // positioning checks (flexible)
      reqs.push(
        req(
          ".relative-box uses position",
          ruleSatisfies(rules, ".relative-box", { anyProps: RELATED.position }),
          "Use position: relative."
        )
      );
      reqs.push(
        req(
          ".relative-box uses offsets (top/left/etc.)",
          ruleSatisfies(rules, ".relative-box", { anyProps: RELATED.offset }),
          "Use top/left or inset."
        )
      );

      reqs.push(
        req(
          ".absolute-parent uses position (likely relative)",
          ruleSatisfies(rules, ".absolute-parent", { anyProps: RELATED.position }),
          "Use position: relative."
        )
      );
      reqs.push(
        req(
          ".absolute-child uses position (likely absolute)",
          ruleSatisfies(rules, ".absolute-child", { anyProps: RELATED.position }),
          "Use position: absolute."
        )
      );
      reqs.push(
        req(
          ".absolute-child uses offsets (top/right/etc.)",
          ruleSatisfies(rules, ".absolute-child", { anyProps: RELATED.offset }),
          "Use top/right or inset."
        )
      );

      reqs.push(
        req(
          ".fixed-badge uses position fixed",
          ruleSatisfies(rules, ".fixed-badge", { anyProps: RELATED.position }),
          "Use position: fixed."
        )
      );
      reqs.push(
        req(
          ".fixed-badge uses offsets (bottom/right/etc.)",
          ruleSatisfies(rules, ".fixed-badge", { anyProps: RELATED.offset }),
          "Use bottom/right or inset."
        )
      );

      // stacking: require z-index on stack.a and stack.b
      reqs.push(req(".stack.a uses z-index", ruleSatisfies(rules, ".stack.a", { anyProps: RELATED.zIndex }), "Use z-index."));
      reqs.push(req(".stack.b uses z-index", ruleSatisfies(rules, ".stack.b", { anyProps: RELATED.zIndex }), "Use z-index."));

      // ensure overlap intent: position set on .stack or .stack.a/.stack.b
      const stackPositioned =
        ruleSatisfies(rules, ".stack", { anyProps: RELATED.position }) ||
        ruleSatisfies(rules, ".stack.a", { anyProps: RELATED.position }) ||
        ruleSatisfies(rules, ".stack.b", { anyProps: RELATED.position });
      reqs.push(req("Stack squares are positioned (absolute/relative)", stackPositioned, "Use position to overlap squares."));

      return reqs;
    },
  },
];

/** ---------- Grade tasks (direct marks; no normalization) ---------- */
const taskResults = tasks.map((t) => {
  const reqs = status === 2 ? [req("No submission / empty CSS → cannot grade TODOs", false)] : t.requirements();
  const { fraction } = scoreFromRequirements(reqs);
  const earned = status === 2 ? 0 : Math.round(t.marks * fraction);
  return { id: t.id, name: t.name, earned, max: t.marks, reqs };
});

const earnedTodoMarks = taskResults.reduce((sum, r) => sum + r.earned, 0);
const totalEarned = Math.min(earnedTodoMarks + submissionMarks, TOTAL_MAX);

/** ---------- Build Summary ---------- */
const now = new Date().toISOString();

let summary = `# Lab | ${LAB_NAME} | Autograding Summary

- Student: \`${studentId}\`
- ${cssLoadNote}
- ${submissionStatusText}
- Due (Riyadh): \`${DUE_ISO}\`
- Status: **${status}** (0=on time, 1=late, 2=no submission/empty)
- Run: \`${now}\`

## Marks Breakdown

| Item | Marks |
|------|------:|
`;

for (const tr of taskResults) summary += `| ${tr.id}: ${tr.name} | ${tr.earned}/${tr.max} |\n`;
summary += `| Submission | ${submissionMarks}/${SUBMISSION_MAX} |\n`;

summary += `
## Total Marks

**${totalEarned} / ${TOTAL_MAX}**

## Detailed Feedback
`;

for (const tr of taskResults) {
  summary += `\n### ${tr.id}: ${tr.name}\n`;
  summary += formatReqs(tr.reqs).join("\n") + "\n";
}

/** ---------- Write outputs ---------- */
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}

/** DO NOT change CSV structure */
const csv = `student_username,obtained_marks,total_marks,status
${studentId},${totalEarned},100,${status}
`;

fs.writeFileSync(path.join(ARTIFACTS_DIR, "grade.csv"), csv);
fs.writeFileSync(path.join(FEEDBACK_DIR, "README.md"), summary);

console.log(`✔ Lab graded: ${totalEarned}/100 (status=${status})`);
