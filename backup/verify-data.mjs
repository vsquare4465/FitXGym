// Node 22.13+; imports into memory only and never connects to production.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
const folder = process.argv[2];
if (!folder) throw new Error('Pass the extracted backup folder.');
const db = new DatabaseSync(':memory:');
try {
  // D1 exports tables in arbitrary order; check relationships after all imports.
  db.exec('PRAGMA foreign_keys=OFF');
  db.exec(fs.readFileSync(path.join(folder, 'database.sql'), 'utf8'));
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  const referenced = new Set(); let rowCount = 0;
  for (const { name } of tables) {
    for (const row of db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all()) {
      rowCount++;
      for (const value of Object.values(row)) if (typeof value === 'string') {
        for (const match of value.matchAll(/\/api\/public\/media\/([a-f0-9]{64})/g)) referenced.add(match[1]);
      }
    }
  }
  const media = JSON.parse(fs.readFileSync(path.join(folder, 'media-index.json'), 'utf8'));
  for (const key of referenced) assert.ok(media.some(item => item.key === key), 'A database-referenced upload is missing from the backup.');
  for (const item of media) {
    assert.ok(fs.existsSync(path.join(folder, item.file)), 'A media file is missing.');
    assert.ok(item.metadata?.contentType, 'Upload MIME metadata is missing.');
  }
  const secrets = JSON.parse(fs.readFileSync(path.join(folder, 'recovery-secrets.json'), 'utf8'));
  assert.ok(secrets.AUTH_PEPPER?.length >= 32 && secrets.JWT_SECRET?.length >= 32);
  console.log(`PASS: restored ${tables.length} tables / ${rowCount} rows into temporary SQLite; integrity and foreign keys passed. All ${referenced.size} referenced uploads are backed up; ${media.length} media files and recovery secret presence verified.`);
} finally { db.close(); }
