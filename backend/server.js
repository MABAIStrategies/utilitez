import express from "express";
import cors from "cors";
import { providers } from "./providers.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "utilitez-api" });
});

app.get("/providers", (req, res) => {
  res.json({ count: providers.length, providers });
});

app.get("/providers/search", (req, res) => {
  const state = (req.query.state || "").toUpperCase().trim();
  const type = (req.query.type || "").toLowerCase().trim();

  let results = providers;
  if (state) results = results.filter(p => p.state === state);
  if (type) results = results.filter(p => p.type.toLowerCase().includes(type));

  res.json({ count: results.length, providers: results });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Utilitez API running: http://localhost:${PORT}`);
});
