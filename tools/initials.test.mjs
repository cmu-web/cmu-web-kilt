// Tests for the profile picture initials in js/cmu-app.js: the letters the
// kit works out from data-cmu-name, and data-cmu-initials winning over it.
//   npm run test:initials
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../js/cmu-app.js", import.meta.url), "utf8");

// The script runs in a browser, so pull out the two functions this tests
function grab(name) {
  const match = source.match(new RegExp(`function ${name}\\(\\w+\\) \\{[\\s\\S]*?\\n  \\}`));
  assert.ok(match, `js/cmu-app.js has no function ${name}`);
  return match[0];
}
const initialsOf = new Function(`return ${grab("initialsOf")}`)();
const initials = new Function("initialsOf", `return ${grab("initials")}`)(initialsOf);

test("first and last names, whatever is between them", () => {
  assert.equal(initialsOf("Andrew Carnegie"), "AC");
  assert.equal(initialsOf("Henry Clay Frick"), "HF");
  assert.equal(initialsOf("Ludwig van Beethoven"), "LB");
  assert.equal(initialsOf("Mary Smith-Jones"), "MS");
  assert.equal(initialsOf("  herbert   simon "), "HS");
  assert.equal(initialsOf("Scotty"), "S");
  assert.equal(initialsOf(""), "");
});

test("a suffix doesn't count as the last name, with or without a comma", () => {
  assert.equal(initialsOf("Henry Posner, III"), "HP");
  assert.equal(initialsOf("Henry Posner III"), "HP");
  assert.equal(initialsOf("Andrew Mellon Jr."), "AM");
  assert.equal(initialsOf("Andrew Carnegie, Jr."), "AC");
});

test('"Last, First" reads first name first', () => {
  assert.equal(initialsOf("Carnegie, Andrew"), "AC");
  assert.equal(initialsOf("Posner, Henry, III"), "HP");
  assert.equal(initialsOf("Mellon, Andrew W."), "AM");
});

test("a letter outside the basic alphabet stays whole", () => {
  assert.equal(initialsOf("𝒜da Lovelace"), "𝒜L");
});

test("data-cmu-initials wins over data-cmu-name, as given", () => {
  const el = (attrs) => ({
    textContent: "",
    getAttribute: (name) => attrs[name] ?? null,
  });
  const both = el({ "data-cmu-name": "Henry Posner, III", "data-cmu-initials": "HPIII" });
  initials(both);
  assert.equal(both.textContent, "HPIII");
  const nameOnly = el({ "data-cmu-name": "Margaret Morrison" });
  initials(nameOnly);
  assert.equal(nameOnly.textContent, "MM");
  const blank = el({ "data-cmu-name": "Andrew Mellon", "data-cmu-initials": "  " });
  initials(blank);
  assert.equal(blank.textContent, "AM");
});
