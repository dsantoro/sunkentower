import test from "node:test";
import assert from "node:assert/strict";
import {
  getGameDate,
  getNextAvailableAt,
  formatCountdown,
} from "../src/tower.js";

test("tower availability is three calendar days later at the 04:00 reset", () => {
  const availableAt = getNextAvailableAt("2026-10-19");
  assert.equal(availableAt.getFullYear(), 2026);
  assert.equal(availableAt.getMonth(), 9);
  assert.equal(availableAt.getDate(), 22);
  assert.equal(availableAt.getHours(), 4);
  assert.equal(availableAt.getMinutes(), 0);
});

test("a tower recorded before 04:00 belongs to the previous game day", () => {
  assert.equal(getGameDate(new Date(2026, 9, 19, 3, 59)), "2026-10-18");
  assert.equal(getGameDate(new Date(2026, 9, 19, 4, 0)), "2026-10-19");
});

test("countdown reports days, hours, and minutes until availability", () => {
  const availableAt = new Date(2026, 9, 22, 4, 0);
  const now = new Date(2026, 9, 20, 3, 0).getTime();
  assert.equal(formatCountdown(availableAt, now), "2d 01h 00m");
});
