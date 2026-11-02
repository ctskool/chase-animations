import assert from "node:assert/strict";
import { test } from "node:test";
import { atlasBox, makeFrame, parseMoves, pickZoom, tileRange, unrollMoves } from "../route.mjs";

const at = (key, lon, lat = 0) => ({ key, label: key, lon, lat });

test("a move is two places, and a chain is several moves", () => {
  assert.deepEqual(parseMoves(["Lisbon > Rio de Janeiro"]), [{ from: "Lisbon", to: "Rio de Janeiro", heading: null }]);
  assert.deepEqual(parseMoves(["A > B > C"]).map((m) => [m.from, m.to]), [["A", "B"], ["B", "C"]]);
  assert.throws(() => parseMoves(["Lisbon"]), /needs/);
  assert.throws(() => parseMoves(["Lisbon > "]), /needs/);
});

test("a heading says which way round the world a move goes", () => {
  assert.deepEqual(parseMoves(["Rio de Janeiro > Manila (west)"])[0], { from: "Rio de Janeiro", to: "Manila", heading: "west" });
});

test("a move over the Pacific stays one unbroken line", () => {
  const [move] = unrollMoves([{ from: at("Tokyo", 139.7), to: at("San Francisco", -122.4) }]);
  assert.equal(move.from.lon, 139.7);
  assert.ok(Math.abs(move.to.lon - 237.6) < 1e-9);
});

test("the short way round is the default, and a heading overrides it", () => {
  const short = unrollMoves([{ from: at("Rio", -43), to: at("Manila", 121) }]);
  assert.equal(short[0].to.lon, 121);
  const west = unrollMoves([{ from: at("Rio", -43), to: at("Manila", 121), heading: "west" }]);
  assert.equal(west[0].to.lon, -239);
});

test("going round the world ends a full turn from the start", () => {
  const moves = unrollMoves([
    { from: at("Lisbon", -9), to: at("Rio", -43) },
    { from: at("Rio", -43), to: at("Manila", 121), heading: "west" },
    { from: at("Manila", 121), to: at("Lisbon", -9), heading: "west" },
  ]);
  assert.equal(moves[2].from.lon, -239);
  assert.equal(moves[2].to.lon, -369);
});

test("moves from the same place all leave the same point", () => {
  const moves = unrollMoves([
    { from: at("London", 0), to: at("Tokyo", 139) },
    { from: at("London", 0), to: at("Sydney", 151) },
  ]);
  assert.equal(moves[1].from.lon, 0);
});

test("tile columns carry on past the edge of the world when wrapped", () => {
  const box = { minU: -0.3, maxU: 0.3, minV: 0.3, maxV: 0.6 };
  assert.equal(tileRange(box, 3).minX, 0);
  assert.equal(tileRange(box, 3, { wrap: true }).minX, -3);
  assert.ok(pickZoom(box, { wrap: true }) <= pickZoom(box));
});

test("the map is taller than a wide route, for portrait frames", () => {
  const frame = makeFrame([[-20, 40], [40, 40]]);
  const box = atlasBox(frame);
  assert.ok(box.maxV - box.minV > box.maxU - box.minU);
  assert.ok(box.minU < 0.5 && box.maxU > 0.5);
});
