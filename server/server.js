import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error("CORS: origin not allowed"));
    },
    methods: ["GET"],
  })
);

app.use(express.json());

app.use(
  "/api/",
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please wait and try again." },
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5050;
const USE_DB = process.env.USE_DB === "true";
let dbQuery = null;

if (USE_DB) {
  const requiredDbEnv = ["DB_HOST", "DB_USER", "DB_NAME"];
  const missing = requiredDbEnv.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required env vars for DB mode: ${missing.join(", ")}`);
    process.exit(1);
  }
  try {
    const dbMod = await import("./db.js");
    dbQuery = dbMod.query;
  } catch (err) {
    console.warn("Could not load DB module, falling back to file-based datasets.", err?.message || err);
    dbQuery = null;
  }
}

const STATE_FILE_MAP = {
  DE: "delaware.json",
  MD: "maryland.json",
  PA: "pennsylvania.json",
};

function isValidZip(zip) {
  return typeof zip === "string" && /^[0-9]{5}$/.test(zip);
}

function normalizeState(state) {
  if (!state) return "";
  return String(state).trim().toUpperCase();
}

function loadStateData(stateCode) {
  const fileName = STATE_FILE_MAP[stateCode];
  if (!fileName) return null;
  const filePath = path.join(__dirname, "data", fileName);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function matchesZip(provider, zip) {
  let zipCodes = provider?.zipCodes || null;
  let zipPrefixes = provider?.zipPrefixes || null;

  if (typeof zipCodes === "string") {
    try { zipCodes = JSON.parse(zipCodes); } catch { zipCodes = null; }
  }
  if (typeof zipPrefixes === "string") {
    try { zipPrefixes = JSON.parse(zipPrefixes); } catch { zipPrefixes = null; }
  }

  if (Array.isArray(zipCodes) && zipCodes.includes(zip)) return true;
  if (Array.isArray(zipPrefixes)) return zipPrefixes.some((p) => zip.startsWith(p));
  return false;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "utilit-ez-server", time: new Date().toISOString() });
});

app.get("/api/states", async (_req, res) => {
  if (USE_DB && dbQuery) {
    try {
      const rows = await dbQuery("SELECT code, name FROM states ORDER BY name");
      return res.json(rows.map((r) => ({ code: r.code, name: r.name })));
    } catch (err) {
      console.error("DB states error", err);
      return res.status(500).json({ error: "Failed to query states from DB" });
    }
  }

  res.json([
    { code: "DE", name: "Delaware" },
    { code: "MD", name: "Maryland" },
    { code: "PA", name: "Pennsylvania" },
  ]);
});

app.get("/api/providers", async (req, res) => {
  const state = normalizeState(req.query.state);
  const zip = String(req.query.zip || "").trim();
  const type = String(req.query.type || "").trim();

  if (!STATE_FILE_MAP[state]) {
    return res.status(400).json({ error: "Invalid state. Use DE, MD, or PA." });
  }

  if (!isValidZip(zip)) {
    return res.status(400).json({ error: "Invalid ZIP. Must be 5 digits." });
  }

  if (USE_DB && dbQuery) {
    try {
      const rows = await dbQuery("SELECT * FROM providers WHERE state_code = ?", [state]);
      const providers = (rows || [])
        .filter((p) => matchesZip(p, zip))
        .filter((p) => (type ? String(p.type).toLowerCase() === type.toLowerCase() : true))
        .map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          serviceArea: p.service_area || null,
          phone: p.phone || null,
          website: p.website || null,
          notes: null,
        }));

      return res.json({ query: { state, zip, type: type || null }, count: providers.length, providers });
    } catch (err) {
      console.error("DB providers error", err);
      return res.status(500).json({ error: "Failed to query providers from DB" });
    }
  }

  let data;
  try {
    data = loadStateData(state);
  } catch {
    return res.status(500).json({ error: "Failed to load state dataset." });
  }

  const providers = (data?.providers || [])
    .filter((p) => matchesZip(p, zip))
    .filter((p) => (type ? String(p.type).toLowerCase() === type.toLowerCase() : true))
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      serviceArea: p.serviceArea,
      phone: p.phone || null,
      website: p.website || null,
      notes: p.notes || null,
    }));

  res.json({ query: { state, zip, type: type || null }, count: providers.length, providers });
});

const clientDist = path.join(__dirname, "..", "Client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Utilit-Ez server running on http://localhost:${PORT}`);
});
