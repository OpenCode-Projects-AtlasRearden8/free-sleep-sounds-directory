// Test suite for the Free Sleep Sounds Directory.
// Run with: npm test   (uses the built-in node:test runner, no dependencies)

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const { SOURCES, CATEGORIES } = require("../data/sources.js");
const engine = require("../audio-engine.js");
const app = require("../app.js");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

/* ------------------------------- data tests ------------------------------- */

const VALID_TYPES = ["site", "video", "howto", "local", "trick", "os"];
const CAT_IDS = CATEGORIES.map((c) => c.id);

test("sources: every entry is complete and valid", () => {
  assert.ok(SOURCES.length >= 12, "should have at least 12 sources");
  const seen = new Set();
  for (const s of SOURCES) {
    assert.ok(s.id, `${s.id} has id`);
    assert.ok(!seen.has(s.id), `id ${s.id} is unique`);
    seen.add(s.id);
    assert.ok(s.name && s.name.length >= 4, `${s.id} has a name`);
    assert.ok(s.notes && s.notes.length >= 30, `${s.id} has a real note`);
    assert.ok(VALID_TYPES.includes(s.type), `${s.id} has a valid type`);
    assert.ok(Array.isArray(s.categories) && s.categories.length > 0, `${s.id} has categories`);
    for (const c of s.categories) assert.ok(CAT_IDS.includes(c), `${s.id} category ${c} exists`);
    assert.equal(s.signupRequired, false, `${s.id} must require no signup`);
    assert.equal(s.adTricks, false, `${s.id} must not be an ads-trick pick`);
    assert.equal(typeof s.focusPick, "boolean", `${s.id} focusPick is boolean`);
    assert.equal(typeof s.asmrSafe, "boolean", `${s.id} asmrSafe is boolean`);
    if (s.url !== null) {
      assert.ok(s.url.startsWith("https://"), `${s.id} url is https`);
    } else {
      assert.ok(["local", "os"].includes(s.type), `${s.id} null url only for local/os types`);
    }
  }
});

test("data: all required topic coverage exists", () => {
  const has = (catId) => SOURCES.some((s) => s.categories.includes(catId));
  for (const req of ["brown-noise", "rain", "fan", "asmr-safe", "streamers", "youtube-tricks", "timers", "focus"]) {
    assert.ok(has(req), `topic ${req} is covered`);
  }
  assert.ok(SOURCES.some((s) => s.type === "trick"), "has YouTube length tricks");
  assert.ok(SOURCES.filter((s) => s.type === "os" && s.url === null).length >= 3, "has device/os sleep timers");
});

test("data: focus-adjacent sources are flagged as focus picks", () => {
  for (const s of SOURCES) {
    if (s.categories.includes("focus")) {
      assert.equal(s.focusPick, true, `${s.id} tagged focus should be a focusPick`);
    }
  }
});

/* ------------------------------ engine tests ------------------------------ */

test("makeFadePlan: fade never exceeds total and curve ramps to 1", () => {
  const p = engine.makeFadePlan(45 * 60, 120);
  assert.equal(p.total, 2700);
  assert.ok(p.fade <= p.total);
  assert.equal(p.curve.length, p.fade);
  assert.equal(p.curve[p.curve.length - 1], 1);
  for (let i = 1; i < p.curve.length; i++) assert.ok(p.curve[i] > p.curve[i - 1], "fade curve rises");
});

test("makeFadePlan: clamps nonsense input", () => {
  assert.ok(engine.makeFadePlan(0, 999).fade <= engine.makeFadePlan(0, 999).total + 1);
});

test("parseMinutes: accepts 1..480, rejects junk", () => {
  assert.equal(engine.parseMinutes("45"), 45);
  assert.equal(engine.parseMinutes("45.7"), 46);
  assert.equal(engine.parseMinutes(1), 1);
  assert.equal(engine.parseMinutes(480), 480);
  assert.equal(engine.parseMinutes(0), null);
  assert.equal(engine.parseMinutes(481), null);
  assert.equal(engine.parseMinutes("banana"), null);
  assert.equal(engine.parseMinutes(""), null);
});

test("remainingLabel: mm:ss formatting", () => {
  assert.equal(engine.remainingLabel(2754), "45:54");
  assert.equal(engine.remainingLabel(65), "1:05");
  assert.equal(engine.remainingLabel(9.7), "0:10");
  assert.equal(engine.remainingLabel(0), "0:00");
  assert.equal(engine.remainingLabel(-5), "0:00");
});

test("brownNoiseAmplitude: stays in range [-3.5..3.5] over a walk", () => {
  let v = 0;
  let max = 0;
  for (let i = 0; i < 100000; i++) {
    v = engine.brownNoiseAmplitude(v, Math.random());
    max = Math.max(max, Math.abs(v));
  }
  assert.ok(max <= 3.5, `amplitude max ${max} within headroom`);
});

/* -------------------------------- app tests -------------------------------- */

test("esc: escapes all five dangerous characters", () => {
  assert.equal(app.esc(`<a href="x">&'</a>`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
  assert.equal(app.esc(123), "123");
});

/* ------------------------------ static site checks ------------------------ */

test("index.html wires up data, engine, app, styles", () => {
  const html = read("index.html");
  for (const f of ['src="data/sources.js"', 'src="audio-engine.js"', 'src="app.js"', 'href="styles.css"']) {
    assert.ok(html.includes(f), `index.html references ${f}`);
  }
  assert.ok(html.includes('id="focus-toggle"'), "ADHD focus edition toggle exists");
  assert.ok(html.includes('id="timer"'), "sleep timer section exists");
  assert.ok(!/src="/.test(html.replace(/src="(?:data\/sources|audio-engine|app)\.js"/g, "")), "no remote scripts loaded");
});

test("no http:// (insecure) links anywhere in html or data", () => {
  for (const file of ["index.html", "data/sources.js", "README.md", "STATUS.md"]) {
    if (!fs.existsSync(path.join(ROOT, file))) continue;
    const text = read(file);
    const insecure = text.split("\n").filter((line) => line.includes("http://") && !line.includes("http://localhost"));
    assert.equal(insecure.length, 0, `${file} has no insecure external link (${insecure.join(" | ")})`);
  }
});

test("LICENSE has the exact required copyright line (MIT)", () => {
  const lic = read("LICENSE");
  assert.ok(lic.includes("MIT License"), "LICENSE mentions MIT");
  assert.ok(
    lic.includes("Copyright (c) 2026 Asdale Dynamics, LLC"),
    "LICENSE copyright line is exact"
  );
});

test("README credits Asdale Dynamics, LLC", () => {
  assert.ok(read("README.md").includes("Asdale Dynamics, LLC"));
});

test("STATUS.md exists", () => {
  assert.ok(read("STATUS.md").length > 100);
});

test("app.js and server.js are valid syntax", () => {
  for (const f of ["app.js", "audio-engine.js", "data/sources.js", "server.js"]) {
    new Function(read(f)); // throws on syntax error (non-module code)
  }
});
