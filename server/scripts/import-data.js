import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool, { query } from '../db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS states (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(8) UNIQUE NOT NULL,
      name VARCHAR(128) NOT NULL
    ) ENGINE=InnoDB;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS providers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      state_code VARCHAR(8) NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(64),
      website VARCHAR(512),
      phone VARCHAR(64),
      zip_codes TEXT,
      zip_prefixes TEXT,
      INDEX (state_code),
      FOREIGN KEY (state_code) REFERENCES states(code) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);
}

function serializeArray(arr) {
  if (!arr) return null;
  return JSON.stringify(arr);
}

async function importStateFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(raw);
  const stateCode = data.state.code;
  const stateName = data.state.name;

  await query('INSERT INTO states (code, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)', [stateCode, stateName]);

  const providers = data.providers || [];
  for (const p of providers) {
    await query(
      `INSERT INTO providers (state_code, name, type, website, phone, zip_codes, zip_prefixes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [stateCode, p.name || null, p.type || null, p.website || null, p.phone || null, serializeArray(p.zipCodes || null), serializeArray(p.zipPrefixes || null)]
    );
  }
}

async function main() {
  try {
    console.log('Ensuring DB schema...');
    await ensureSchema();

    const dataDir = path.join(__dirname, '..', 'server', 'data');
    const files = await fs.readdir(dataDir);
    for (const f of files) {
      if (f.endsWith('.json')) {
        console.log('Importing', f);
        await importStateFile(path.join(dataDir, f));
      }
    }

    console.log('Import complete.');
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
}

main();
