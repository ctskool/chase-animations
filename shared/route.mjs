// Turns two places, or a recorded track, into a map file route-map can draw. It runs once, before rendering,
// so the render itself never touches the network. Everything here is free and needs no API key.
import fs from "node:fs";
import path from "node:path";
import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";
import { UsageError } from "./build.mjs";

const AGENT = "chase-animations/0.1 (route-map animation)";
const GEOCODER = "https://nominatim.openstreetmap.org/search";
const TILES = "https://tiles.openfreemap.org/planet";
const ROUTERS = {
  drive: "https://router.project-osrm.org/route/v1/driving",
  bike: "https://routing.openstreetmap.de/routed-bike/route/v1/driving",
  walk: "https://routing.openstreetmap.de/routed-foot/route/v1/driving",
};
const SPEEDS_KMH = { drive: 40, bike: 15, walk: 5 };

const EQUATOR_M = 40075016.7;
const MAX_ZOOM = 14;
const MAX_TILES = 64;
const MAX_BUILDINGS = 12000;
const MAX_ROUTE_POINTS = 900;
const MAX_TURNS = 7;

// Both map licences ask for this on the finished video, so route-map always draws it.
export const ATTRIBUTION = "OpenFreeMap © OpenMapTiles · © OpenStreetMap contributors";

// Longest detail first. A road class only appears once the route is short enough for it to be readable.
const ROADS = {
  motorway: { tier: "motorway", metres: 24 },
  trunk: { tier: "motorway", metres: 22 },
  primary: { tier: "primary", metres: 17 },
  secondary: { tier: "secondary", metres: 14 },
  tertiary: { tier: "tertiary", metres: 12 },
  minor: { tier: "minor", metres: 9, spanLimit: 30000 },
  service: { tier: "service", metres: 6, spanLimit: 5000 },
  path: { tier: "path", metres: 3, spanLimit: 2500 },
};

const GREEN_COVER = new Set(["grass", "wood", "wetland"]);
const GREEN_USE = new Set(["cemetery", "pitch", "stadium"]);
const PLACE_TIERS = { neighbourhood: 0, quarter: 0, suburb: 0, village: 0, hamlet: 1, town: 0, city: 1 };
const LANDMARKS = new Set(["attraction", "museum", "stadium", "railway", "college", "theatre", "castle", "monument"]);

const mercatorU = (lon) => (lon + 180) / 360;
const mercatorV = (lat) => (1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2;

export function haversine(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLon = (b[0] - a[0]) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371008 * Math.asin(Math.sqrt(h));
}

export function pathLength(coords) {
  let total = 0;
  for (let i = 1; i < coords.length; i++) total += haversine(coords[i - 1], coords[i]);
  return total;
}

// "41.87, -87.63" is a point. Anything else is a place name to look up.
export function parsePoint(text) {
  const m = String(text).trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null;
}

// A GPX file, or GeoJSON with a line in it. Returns [lon, lat] points plus the recorded seconds, if the file has them.
export function parseTrack(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const json = JSON.parse(trimmed);
    const geometry = json.geometry ?? json.features?.find((f) => f.geometry?.type?.includes("LineString"))?.geometry ?? json;
    const line = geometry.type === "MultiLineString" ? geometry.coordinates.flat() : geometry.coordinates ?? geometry;
    return { coords: line.map(([lon, lat]) => [lon, lat]), seconds: null };
  }
  const coords = [];
  const times = [];
  for (const m of trimmed.matchAll(/<(?:trkpt|rtept)\b([^>]*?)(\/>|>([\s\S]*?)<\/(?:trkpt|rtept)>)/g)) {
    const lat = m[1].match(/lat="([^"]+)"/);
    const lon = m[1].match(/lon="([^"]+)"/);
    if (!lat || !lon) continue;
    coords.push([Number(lon[1]), Number(lat[1])]);
    const time = m[3]?.match(/<time>([^<]+)<\/time>/);
    if (time) times.push(Date.parse(time[1]));
  }
  const seconds = times.length > 1 ? (times[times.length - 1] - times[0]) / 1000 : null;
  return { coords, seconds: seconds > 0 ? seconds : null };
}

function deviation(points, from, to, i) {
  const [ax, ay] = points[from];
  const [bx, by] = points[to];
  const [px, py] = points[i];
  const dx = bx - ax;
  const dy = by - ay;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length)) : 0;
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

// The points that matter most to the route's shape, as indices, always keeping both ends.
export function simplifyIndices(points, { limit, tolerance = 0 }) {
  const kept = [0, points.length - 1];
  while (kept.length < limit) {
    let best = null;
    for (let k = 1; k < kept.length; k++) {
      for (let i = kept[k - 1] + 1; i < kept[k]; i++) {
        const d = deviation(points, kept[k - 1], kept[k], i);
        if (d > tolerance && (!best || d > best.d)) best = { d, i, k };
      }
    }
    if (!best) break;
    kept.splice(best.k, 0, best.i);
  }
  return kept;
}

function thinRoute(points) {
  if (points.length <= MAX_ROUTE_POINTS) return points;
  // A coarse first pass keeps the slow step above fast on long recorded tracks.
  const stride = Math.ceil(points.length / (MAX_ROUTE_POINTS * 4));
  const coarse = points.filter((_, i) => i % stride === 0 || i === points.length - 1);
  return simplifyIndices(coarse, { limit: MAX_ROUTE_POINTS }).map((i) => coarse[i]);
}

export function tripTimes(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  const steps = 5;
  if (minutes < 100) {
    const countdown = Array.from({ length: steps }, (_, i) => Math.round((minutes * (i + 1)) / steps));
    return { finalMinutes: minutes, tripTime: `${minutes} min`, countdown: [...new Set(countdown)].filter(Boolean).join(", ") };
  }
  const hours = Math.round(minutes / 6) / 10;
  const countdown = Array.from({ length: steps }, (_, i) => (Math.round((hours * (i + 1) * 10) / steps) / 10).toFixed(1));
  return { finalMinutes: hours, tripTime: `${hours.toFixed(1)} hr`, countdown: [...new Set(countdown)].join(", ") };
}

export function tripDistance(metres, units) {
  const value = units === "mi" ? metres / 1609.344 : metres / 1000;
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units}`;
}

const ROAD_WORDS = {
  North: "N",
  South: "S",
  East: "E",
  West: "W",
  Avenue: "Ave",
  Boulevard: "Blvd",
  Drive: "Dr",
  Freeway: "Fwy",
  Highway: "Hwy",
  Parkway: "Pkwy",
  Road: "Rd",
  Street: "St",
};

export function shortRoad(name) {
  const words = name.split(" ");
  return words.map((word, i) => (i === 0 && words.length < 3 ? word : ROAD_WORDS[word] ?? word)).join(" ");
}

export function tileRange(box, z) {
  const n = 2 ** z;
  const clamp = (v) => Math.max(0, Math.min(n - 1, Math.floor(v * n)));
  return { minX: clamp(box.minU), maxX: clamp(box.maxU), minY: clamp(box.minV), maxY: clamp(box.maxV) };
}

export function pickZoom(box) {
  for (let z = MAX_ZOOM; z > 1; z--) {
    const r = tileRange(box, z);
    if ((r.maxX - r.minX + 1) * (r.maxY - r.minY + 1) <= MAX_TILES) return z;
  }
  return 1;
}

async function getJson(url, what) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": AGENT } });
      if (res.ok) return await res.json();
      if (res.status === 400) return { error: await res.text() };
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt >= 3) throw new UsageError(`Couldn't reach ${what}: ${err.message}. Check your connection and try again.`);
      await new Promise((done) => setTimeout(done, 800 * 2 ** attempt));
    }
  }
}

async function findPlace(text, lastLookup) {
  const point = parsePoint(text);
  if (point) return { ...point, name: text, label: null, country: null };
  // Nominatim allows one request a second.
  const wait = lastLookup.at + 1100 - Date.now();
  if (wait > 0) await new Promise((done) => setTimeout(done, wait));
  lastLookup.at = Date.now();
  const query = new URLSearchParams({ q: text, format: "jsonv2", limit: "1", addressdetails: "1" });
  const [hit] = await getJson(`${GEOCODER}?${query}`, "the place search");
  if (!hit) throw new UsageError(`Couldn't find "${text}". Try adding the city, or pass "lat,lon".`);
  return {
    lat: Number(hit.lat),
    lon: Number(hit.lon),
    name: hit.display_name,
    label: hit.name || text.split(",")[0].trim(),
    country: hit.address?.country_code ?? null,
  };
}

async function findRoute(stops, mode) {
  const points = stops.map((s) => `${s.lon},${s.lat}`).join(";");
  const url = `${ROUTERS[mode]}/${points}?overview=full&geometries=geojson&steps=true`;
  const answer = await getJson(url, "the route service");
  const route = answer.routes?.[0];
  if (!route) throw new UsageError(`No ${mode} route between those places. Try another --mode, or pass --track with your own route.`);
  const byRoad = new Map();
  for (const step of route.legs.flatMap((leg) => leg.steps)) {
    if (step.name) byRoad.set(step.name, (byRoad.get(step.name) ?? 0) + step.distance);
  }
  // The longest road the card has room to name.
  const [road] = [...byRoad]
    .map(([name, distance]) => [shortRoad(name), distance])
    .filter(([name]) => name.length <= 20)
    .sort((a, b) => b[1] - a[1])[0] ?? [];
  return { coords: route.geometry.coordinates, metres: route.distance, seconds: route.duration, road };
}

async function downloadTiles(tiles, template) {
  const results = [];
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < tiles.length) {
      const tile = tiles[next++];
      const url = template.replace("{z}", tile.z).replace("{x}", tile.x).replace("{y}", tile.y);
      for (let attempt = 0; ; attempt++) {
        try {
          const res = await fetch(url, { headers: { "User-Agent": AGENT } });
          if (res.status === 404) break;
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          results.push({ ...tile, data: new Uint8Array(await res.arrayBuffer()) });
          break;
        } catch (err) {
          if (attempt >= 3) throw new UsageError(`Couldn't download the map: ${err.message}. Check your connection and try again.`);
          await new Promise((wake) => setTimeout(wake, 800 * 2 ** attempt));
        }
      }
      done += 1;
      process.stdout.write(`\r  Map tiles ${done}/${tiles.length}`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  process.stdout.write("\n");
  return results;
}

// Exterior rings run one way and holes the other, so holes join the exterior just before them.
export function groupRings(rings) {
  const polygons = [];
  for (const ring of rings) {
    let area = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      area += (ring[j].x - ring[i].x) * (ring[j].y + ring[i].y);
    }
    if (area > 0 || !polygons.length) polygons.push([ring]);
    else polygons[polygons.length - 1].push(ring);
  }
  return polygons;
}

function ringArea(flat) {
  let area = 0;
  for (let i = 0, j = flat.length - 2; i < flat.length; j = i, i += 2) {
    area += (flat[j] - flat[i]) * (flat[j + 1] + flat[i + 1]);
  }
  return Math.abs(area / 2);
}

function centroid(flat) {
  let x = 0;
  let y = 0;
  for (let i = 0; i < flat.length; i += 2) {
    x += flat[i];
    y += flat[i + 1];
  }
  return [(x * 2) / flat.length, (y * 2) / flat.length];
}

function distanceToRoute(x, y, samples) {
  let best = Infinity;
  for (const [px, py] of samples) {
    const d = (px - x) ** 2 + (py - y) ** 2;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

function readMap(tiles, frame, { half = frame.half, outer = false } = {}) {
  const { toLocal, span, route } = frame;
  // Tenths of a metre for a walk, whole metres for a long drive. It keeps the map file small.
  const detail = span < 6000 ? 10 : 1;
  const round = (v) => Math.round(v * detail) / detail;
  const out = { water: [], green: [], streams: [], roads: {}, buildings: [], places: new Map() };
  const samples = route.filter((_, i) => i % Math.ceil(route.length / 240) === 0);
  const minGreen = (span / 400) ** 2;

  const inside = (flat) => {
    for (let i = 0; i < flat.length; i += 2) {
      if (Math.abs(flat[i]) < half && Math.abs(flat[i + 1]) < half) return true;
    }
    return false;
  };

  for (const tile of tiles) {
    const vector = new VectorTile(new PbfReader(tile.data));
    const each = (name, visit) => {
      const layer = vector.layers[name];
      if (!layer) return;
      for (let i = 0; i < layer.length; i++) {
        const feature = layer.feature(i);
        const parts = feature.loadGeometry();
        // Tiles repeat their neighbour's edge. Whatever sits wholly in that margin belongs to the neighbour.
        const home = parts.some((part) => part.some((p) => p.x >= 0 && p.x <= layer.extent && p.y >= 0 && p.y <= layer.extent));
        if (home) visit(feature, parts, layer.extent);
      }
    };
    const flatten = (part, extent) => {
      const flat = [];
      for (const p of part) {
        const [x, y] = toLocal(tile, p.x / extent, p.y / extent);
        flat.push(round(x), round(y));
      }
      return flat;
    };
    const polygons = (parts, extent) =>
      groupRings(parts)
        .map((rings) => rings.map((ring) => flatten(ring, extent)))
        .filter((rings) => inside(rings[0]));

    each("water", (feature, parts, extent) => {
      if (feature.properties.brunnel === "tunnel") return;
      out.water.push(...polygons(parts, extent));
    });
    each("waterway", (feature, parts, extent) => {
      if (feature.properties.brunnel === "tunnel") return;
      for (const part of parts) {
        const flat = flatten(part, extent);
        if (inside(flat)) out.streams.push(flat);
      }
    });
    const addGreen = (parts, extent) => {
      for (const rings of polygons(parts, extent)) {
        if (ringArea(rings[0]) >= minGreen) out.green.push(rings);
      }
    };
    each("landcover", (feature, parts, extent) => {
      if (GREEN_COVER.has(feature.properties.class)) addGreen(parts, extent);
    });
    each("landuse", (feature, parts, extent) => {
      if (GREEN_USE.has(feature.properties.class)) addGreen(parts, extent);
    });
    each("park", (feature, parts, extent) => {
      const { class: kind, name, name_en: english } = feature.properties;
      if (kind === "historic") return;
      addGreen(parts, extent);
      const [first] = parts;
      if (!outer && first && (english || name)) addPlace(out.places, english || name, 2, centroid(flatten(first, extent)), samples);
    });
    each("transportation", (feature, parts, extent) => {
      const { class: kind, brunnel, ramp } = feature.properties;
      const road = ROADS[kind];
      if (!road || brunnel === "tunnel" || feature.type !== 2) return;
      if (road.spanLimit && span > road.spanLimit) return;
      if (outer && road.tier !== "motorway" && road.tier !== "primary") return;
      const tier = ramp ? "tertiary" : road.tier;
      for (const part of parts) {
        const flat = flatten(part, extent);
        if (flat.length >= 4 && inside(flat)) (out.roads[tier] ??= []).push(flat);
      }
    });
    if (outer) continue;
    each("building", (feature, parts, extent) => {
      const { render_height: height = 8, render_min_height: base = 0, hide_3d: hide } = feature.properties;
      if (hide) return;
      for (const rings of polygons(parts, extent)) {
        const at = centroid(rings[0]);
        out.buildings.push({ h: Math.round(height), b: Math.round(base), p: rings, d: distanceToRoute(at[0], at[1], samples) });
      }
    });
    each("place", (feature, parts, extent) => {
      const { class: kind, name, name_en: english, rank } = feature.properties;
      if (PLACE_TIERS[kind] === undefined || !(english || name)) return;
      addPlace(out.places, english || name, PLACE_TIERS[kind] + (rank ?? 0) / 100, centroid(flatten(parts[0], extent)), samples);
    });
    each("water_name", (feature, parts, extent) => {
      const { name, name_en: english } = feature.properties;
      if (english || name) addPlace(out.places, english || name, 1, centroid(flatten(parts[0], extent)), samples);
    });
    each("poi", (feature, parts, extent) => {
      const { class: kind, name, name_en: english, rank } = feature.properties;
      if (LANDMARKS.has(kind) && (english || name) && (rank ?? 99) <= 12) {
        addPlace(out.places, english || name, 1.5, centroid(flatten(parts[0], extent)), samples);
      }
    });
  }
  return out;
}

function addPlace(places, name, tier, [x, y], samples) {
  if (name.length > 24 || places.has(name)) return;
  places.set(name, { name, tier, x: Math.round(x), y: Math.round(y), d: Math.round(distanceToRoute(x, y, samples)) });
}

// Everything needed to turn longitude and latitude, or a spot in a tile, into metres from the middle of the route.
export function makeFrame(coords) {
  const lons = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const centerU = mercatorU((minLon + maxLon) / 2);
  const centerV = mercatorV((minLat + maxLat) / 2);
  const metres = EQUATOR_M * Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);

  const fromMercator = (u, v) => [(u - centerU) * metres, (centerV - v) * metres];
  const toMetres = ([lon, lat]) => fromMercator(mercatorU(lon), mercatorV(lat));
  const toLocal = (tile, x, y) => {
    const n = 2 ** tile.z;
    return fromMercator((tile.x + x) / n, (tile.y + y) / n);
  };

  const route = coords.map(toMetres);
  const xs = route.map((p) => p[0]);
  const ys = route.map((p) => p[1]);
  const span = Math.max(30, Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)));
  const half = Math.max(span * 1.5, 400);
  const outerHalf = half * 3;
  const boxOf = (size) => ({
    minU: centerU - size / metres,
    maxU: centerU + size / metres,
    minV: centerV - size / metres,
    maxV: centerV + size / metres,
  });
  return {
    route,
    span,
    half,
    outerHalf,
    box: boxOf(half),
    outerBox: boxOf(outerHalf),
    toLocal,
  };
}

function flatRoute(points) {
  return points.flatMap(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
}

export async function makeRoute(o) {
  const mode = o.mode ?? "drive";
  if (!ROUTERS[mode]) throw new UsageError(`--mode must be drive, bike or walk, got "${mode}"`);
  if (o.track && (o.via?.length || (o.from && o.to))) {
    throw new UsageError("Use --track on its own, or --from and --to, not both.");
  }

  let coords;
  let metres;
  let seconds;
  let road;
  let origin;
  let finish;
  const notes = [];

  if (o.track) {
    const file = path.resolve(o.track);
    if (!fs.existsSync(file)) throw new UsageError(`Can't find ${file}`);
    const track = parseTrack(fs.readFileSync(file, "utf8"));
    if (track.coords.length < 2) throw new UsageError(`No route found in ${file}. Use a GPX file or GeoJSON with a line.`);
    coords = track.coords;
    metres = pathLength(coords);
    seconds = track.seconds;
    if (seconds === null && o.minutes === undefined) {
      seconds = (metres / 1000 / SPEEDS_KMH[mode]) * 3600;
      notes.push(`The file has no times, so the trip time is a guess at ${SPEEDS_KMH[mode]} km/h. Pass --minutes for the real one.`);
    }
    origin = { label: o.from ?? null, country: null };
    finish = { label: o.to ?? null, country: null };
  } else {
    if (!o.from || !o.to) throw new UsageError('route needs --from "<place>" and --to "<place>", or --track <file>');
    const lookup = { at: 0 };
    origin = await findPlace(o.from, lookup);
    const stops = [];
    for (const via of o.via ?? []) stops.push(await findPlace(via, lookup));
    finish = await findPlace(o.to, lookup);
    console.log(`From: ${origin.name}`);
    for (const stop of stops) console.log(`Via:  ${stop.name}`);
    console.log(`To:   ${finish.name}`);
    ({ coords, metres, seconds, road } = await findRoute([origin, ...stops, finish], mode));
    notes.push("The trip time is a routing estimate without live traffic. Pass --minutes if you have the real one.");
  }
  if (o.minutes !== undefined) seconds = Number(o.minutes) * 60;
  if (!Number.isFinite(seconds) || seconds <= 0) throw new UsageError("--minutes needs a number above 0");

  const frame = makeFrame(coords);
  const thin = thinRoute(frame.route);
  const turns = simplifyIndices(thin, { limit: MAX_TURNS + 2, tolerance: frame.span * 0.05 });

  const meta = await getJson(TILES, "the map service");
  const zoom = pickZoom(frame.box);
  const tilesFor = (box, z) => {
    const range = tileRange(box, z);
    const list = [];
    for (let x = range.minX; x <= range.maxX; x++) {
      for (let y = range.minY; y <= range.maxY; y++) list.push({ z, x, y });
    }
    return list;
  };
  console.log(`Route: ${(metres / 1000).toFixed(1)} km. Downloading the map around it at zoom ${zoom}.`);
  const tiles = await downloadTiles(tilesFor(frame.box, zoom), meta.tiles[0]);
  if (!tiles.length) throw new UsageError("The map service returned nothing for this area.");
  const map = readMap(tiles, frame);

  // The wide output sees well past the route, so a coarser ring carries the water, green and main roads to the frame's edges.
  const outerTiles = await downloadTiles(tilesFor(frame.outerBox, pickZoom(frame.outerBox)), meta.tiles[0]);
  const ring = readMap(outerTiles, frame, { half: frame.outerHalf, outer: true });
  map.water.push(...ring.water);
  map.green.push(...ring.green);
  for (const [tier, lines] of Object.entries(ring.roads)) (map.roads[tier] ??= []).push(...lines);

  map.buildings.sort((a, b) => a.d - b.d);
  const buildings = map.buildings.slice(0, MAX_BUILDINGS).map(({ h, b, p }) => ({ h, b, p }));
  const places = [...map.places.values()]
    .filter((p) => Math.hypot(p.x, p.y) < frame.span * 1.1)
    .sort((a, b) => Math.floor(a.tier) - Math.floor(b.tier) || a.d - b.d)
    .slice(0, 16)
    .map(({ name, x, y }) => ({ name, x, y }));

  const data = {
    attribution: ATTRIBUTION,
    mode,
    metres: Math.round(metres),
    seconds: Math.round(seconds),
    span: Math.round(frame.span),
    route: flatRoute(thin),
    turns,
    roads: map.roads,
    water: map.water,
    streams: map.streams,
    green: map.green,
    buildings,
    places,
  };

  const save = path.resolve(o.save ?? "route-map.json");
  fs.writeFileSync(save, JSON.stringify(data));

  const units = o.units ?? (["us", "gb"].includes(finish.country) ? "mi" : "km");
  if (!["mi", "km"].includes(units)) throw new UsageError(`--units must be mi or km, got "${units}"`);
  const varsFile = path.resolve(o.vars ?? "animate-vars.json");
  const existing = fs.existsSync(varsFile) ? JSON.parse(fs.readFileSync(varsFile, "utf8")) : {};
  const suggested = {
    mapData: path.relative(process.cwd(), save).replace(/\\/g, "/"),
    destination: (finish.label ?? "Finish").slice(0, 24),
    ...tripTimes(seconds),
    distance: tripDistance(metres, units),
    fastestLabel: road ? `Via ${road}` : "Your route",
  };
  fs.writeFileSync(varsFile, JSON.stringify({ ...existing, ...suggested }, null, 2) + "\n");

  const size = fs.statSync(save).size / 1048576;
  console.log(`Map: ${map.buildings.length} buildings (kept ${buildings.length}), ${map.water.length} water, ${map.green.length} green, ${places.length} place names`);
  console.log(`Saved ${save} (${size.toFixed(1)} MB) and ${varsFile}`);
  for (const [key, value] of Object.entries(suggested)) console.log(`  ${key.padEnd(14)} ${value}`);
  for (const note of notes) console.log(note);
  return save;
}
