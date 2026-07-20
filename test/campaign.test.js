/*!
 * campaign.test.js — unit tests for extractCid() inbound `cid` parsing.
 * Run: node --test  (or: node --test test/campaign.test.js)
 * Regression guard for board 2026-07-20-191536 (Rayscape deep-link invalid-uuid):
 * a second "?" before the UTM block used to fold the UTMs into the cid, producing
 * an invalid 48-char pseudo-uuid that Postgres rejected. Built-in node:test only —
 * this repo has no build tooling and no npm dependencies.
 */
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { extractCid } = require("../src/campaign.js");

const UUID = "08c5ec78-bf34-414f-9d48-b0a1f9b4c9b6";

test('second "?" before the UTM block is not folded into the cid (the broken Rayscape case)', () => {
  const search = `?cid=${UUID}?utm_source=linkedin&utm_medium=cpa&utm_campaign=rayscapevideo`;
  assert.equal(extractCid(search), UUID);
});

test('well-formed link with "&" before the UTM block still works', () => {
  const search = `?cid=${UUID}&utm_source=linkedin&utm_medium=social&utm_campaign=rayscape`;
  assert.equal(extractCid(search), UUID);
});

test("uppercase uuid is normalized to lowercase", () => {
  const search = `?cid=${UUID.toUpperCase()}`;
  assert.equal(extractCid(search), UUID);
});

test("empty cid returns null", () => {
  assert.equal(extractCid("?cid="), null);
});

test("missing cid returns null", () => {
  assert.equal(extractCid("?utm_source=linkedin"), null);
});

test("no query string returns null", () => {
  assert.equal(extractCid(""), null);
});
