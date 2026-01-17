import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5050;
const USE_DB = process.env.USE_DB === 'true';
let dbQuery = null;
if (USE_DB) {
	try {
		const dbMod = await import('./db.js');
		dbQuery = dbMod.query;
	} catch (err) {
		console.warn('Could not load DB module, falling back to file-based datasets.', err?.message || err);
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
	// supports:
	// - exact ZIP list: zipCodes: ["19103","19104"]
	// - prefix matching: zipPrefixes: ["19","190","191"]
	let zipCodes = provider?.zipCodes || null;
	let zipPrefixes = provider?.zipPrefixes || null;

	if (typeof zipCodes === 'string') {
		try { zipCodes = JSON.parse(zipCodes); } catch (e) { zipCodes = null; }
	}
	if (typeof zipPrefixes === 'string') {
		try { zipPrefixes = JSON.parse(zipPrefixes); } catch (e) { zipPrefixes = null; }
	}

	if (Array.isArray(zipCodes) && zipCodes.includes(zip)) return true;

	if (Array.isArray(zipPrefixes)) {
		return zipPrefixes.some((prefix) => zip.startsWith(prefix));
	}

	return false;
}

app.get("/health", (_req, res) => {
	res.json({ ok: true, name: "utilit-ez-server", time: new Date().toISOString() });
});

app.get("/api/states", async (_req, res) => {
	if (USE_DB) {
		try {
			const rows = await dbQuery('SELECT code, name FROM states');
			return res.json(rows.map(r => ({ code: r.code, name: r.name })));
		} catch (err) {
			console.error('DB states error', err);
			return res.status(500).json({ error: 'Failed to query states from DB' });
		}
	}

	res.json([
		{ code: "DE", name: "Delaware" },
		{ code: "MD", name: "Maryland" },
		{ code: "PA", name: "Pennsylvania" }
	]);
});

/**
 * GET /api/providers?state=PA&zip=19103&type=Electric
 */
app.get("/api/providers", async (req, res) => {
	const state = normalizeState(req.query.state);
	const zip = String(req.query.zip || "").trim();
	const type = String(req.query.type || "").trim();

	if (!STATE_FILE_MAP[state]) {
		return res.status(400).json({
			error: "Invalid state. Use DE, MD, or PA.",
		});
	}

	if (!isValidZip(zip)) {
		return res.status(400).json({
			error: "Invalid ZIP. Must be 5 digits.",
		});
	}

	if (USE_DB) {
		try {
			const rows = await dbQuery('SELECT * FROM providers WHERE state_code = ?', [state]);
			const providers = (rows || [])
				.filter((p) => matchesZip(p, zip))
				.filter((p) => (type ? String(p.type).toLowerCase() === type.toLowerCase() : true))
				.map((p) => ({
					id: p.id,
					name: p.name,
					type: p.type,
					serviceArea: null,
					phone: p.phone || null,
					website: p.website || null,
					notes: null,
				}));

			return res.json({ query: { state, zip, type: type || null }, count: providers.length, providers });
		} catch (err) {
			console.error('DB providers error', err);
			return res.status(500).json({ error: 'Failed to query providers from DB' });
		}
	}

	let data;
	try {
		data = loadStateData(state);
	} catch (e) {
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

	res.json({
		query: { state, zip, type: type || null },
		count: providers.length,
		providers,
	});
});

// Serve client production build if present
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
	app.use(express.static(clientDist));

	// catch-all to serve index.html for client-side routing
	app.get('*', (req, res) => {
		res.sendFile(path.join(clientDist, 'index.html'));
	});
}

app.listen(PORT, () => {
	console.log(`Utilit-Ez server running on http://localhost:${PORT}`);
});

