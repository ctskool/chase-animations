import assert from "node:assert/strict";
import { test } from "node:test";
import {
  groupRings,
  haversine,
  makeFrame,
  parsePoint,
  parseTrack,
  pickZoom,
  shortRoad,
  simplifyIndices,
  tileRange,
  tripDistance,
  tripTimes,
} from "../route.mjs";

test("coordinates are points, names are not", () => {
  assert.deepEqual(parsePoint("41.87, -87.63"), { lat: 41.87, lon: -87.63 });
  assert.equal(parsePoint("Navy Pier, Chicago"), null);
  assert.equal(parsePoint("120, 10"), null);
});

test("a GPX track gives its points and recorded time", () => {
  const gpx = `<gpx><trk><trkseg>
    <trkpt lat="1" lon="2"><time>2026-01-01T10:00:00Z</time></trkpt>
    <trkpt lat="3" lon="4"><ele>5</ele><time>2026-01-01T10:10:00Z</time></trkpt>
  </trkseg></trk></gpx>`;
  assert.deepEqual(parseTrack(gpx), { coords: [[2, 1], [4, 3]], seconds: 600 });
});

test("a GPX file without times has no duration", () => {
  const gpx = `<gpx><rte><rtept lat="1" lon="2"/><rtept lat="3" lon="4"/></rte></gpx>`;
  assert.deepEqual(parseTrack(gpx), { coords: [[2, 1], [4, 3]], seconds: null });
});

test("GeoJSON lines are read from a feature collection", () => {
  const json = JSON.stringify({
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: { type: "LineString", coordinates: [[1, 2, 30], [3, 4, 30]] } }],
  });
  assert.deepEqual(parseTrack(json).coords, [[1, 2], [3, 4]]);
});

test("trip times stay consistent with the final value", () => {
  assert.deepEqual(tripTimes(480), { finalMinutes: 8, tripTime: "8 min", countdown: "2, 3, 5, 6, 8" });
  assert.deepEqual(tripTimes(20), { finalMinutes: 1, tripTime: "1 min", countdown: "1" });
  assert.deepEqual(tripTimes(5.5 * 3600), { finalMinutes: 5.5, tripTime: "5.5 hr", countdown: "1.1, 2.2, 3.3, 4.4, 5.5" });
});

test("distances use the requested units", () => {
  assert.equal(tripDistance(5000, "km"), "5.0 km");
  assert.equal(tripDistance(5000, "mi"), "3.1 mi");
  assert.equal(tripDistance(160934, "mi"), "100 mi");
});

test("long road names shorten without losing a one-word name", () => {
  assert.equal(shortRoad("West Jackson Boulevard"), "W Jackson Blvd");
  assert.equal(shortRoad("Cannon Street"), "Cannon St");
  assert.equal(shortRoad("South Street"), "South St");
  assert.equal(shortRoad("Broadway"), "Broadway");
});

test("simplifying keeps the ends and the sharpest corner", () => {
  const line = [[0, 0], [1, 0.01], [2, 0], [2, 5], [2.01, 6], [2, 10]];
  const kept = simplifyIndices(line, { limit: 3 });
  assert.deepEqual([kept[0], kept[kept.length - 1]], [0, 5]);
  assert.ok(kept.includes(2));
});

test("simplifying stops once the shape is close enough", () => {
  const straight = [[0, 0], [1, 0.001], [2, 0], [3, 0.001], [4, 0]];
  assert.deepEqual(simplifyIndices(straight, { limit: 5, tolerance: 0.1 }), [0, 4]);
});

test("a map's rings keep holes with their outline", () => {
  const square = (size, flip) => {
    const points = [
      { x: 0, y: 0 },
      { x: size, y: 0 },
      { x: size, y: size },
      { x: 0, y: size },
    ];
    return flip ? points.reverse() : points;
  };
  assert.equal(groupRings([square(10), square(2, true)]).length, 1);
  assert.equal(groupRings([square(10), square(4)]).length, 2);
});

test("zoom drops so the tile count stays small", () => {
  const near = { minU: 0.25, maxU: 0.2502, minV: 0.25, maxV: 0.2502 };
  const far = { minU: 0.2, maxU: 0.4, minV: 0.2, maxV: 0.4 };
  assert.equal(pickZoom(near), 14);
  assert.ok(pickZoom(far) < 6);
  const range = tileRange(far, pickZoom(far));
  assert.ok((range.maxX - range.minX + 1) * (range.maxY - range.minY + 1) <= 64);
});

test("the route is centred, with a map wider than the route", () => {
  const coords = [[-0.01, 51.5], [0.01, 51.51]];
  const frame = makeFrame(coords);
  const [start, end] = frame.route;
  assert.ok(Math.abs(start[0] + end[0]) < 1);
  assert.ok(Math.abs(start[1] + end[1]) < 1);
  assert.ok(frame.span > haversine(coords[0], coords[1]) * 0.95);
  assert.ok(frame.half > frame.span && frame.outerHalf > frame.half);
});
