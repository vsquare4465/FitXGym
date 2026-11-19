import fs from 'node:fs';
import { backupKey, decrypt } from './crypto.mjs';
const [input, keyFile, output] = process.argv.slice(2);
if (!input || !keyFile || !output) throw new Error('Usage: node decrypt.mjs BACKUP.fitx KEY.txt OUTPUT.tar.gz');
try {
  const bytes = decrypt(fs.readFileSync(input), backupKey(fs.readFileSync(keyFile, 'utf8').trim()));
  fs.writeFileSync(output, bytes, { flag: 'wx', mode: 0o600 });
  console.log('Backup authenticated and decrypted. Extract the tar.gz into a private folder, then verify before restoring.');
} catch {
  console.error('Decryption failed: check the backup, recovery key, and that the output file does not already exist.');
  process.exitCode = 1;
}
