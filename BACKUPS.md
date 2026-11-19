# Manual FitX Gym backups

An automatic encrypted weekly backup workflow has also been prepared in the private `vsquare4465/FitXGym-backups` GitHub repository. Recovery and encryption secrets have been saved with the owner's approval. GitHub's account-wide Actions budget was verified as $0 with usage blocked on 2026-11-19. **It is not active yet:** creation/storage of the restricted Cloudflare backup token and the first live backup run remain pending. See [cloud backup setup and recovery](backup/README.md). Existing manual backups below continue to work.

Double-click **Backup Gym.cmd** in this project, or run `npm run backup:cf` here. Keep this PC online until it says **Backup complete**. If login has expired, run `npx wrangler login`, then retry. The website keeps running when the PC is off; only this manual backup needs the PC.

Back up at the end of each working day and before large edits/deletions. Use a quiet period when staff have finished saving records: D1 and KV are separate services, so this is not one atomic snapshot across both. Changes after the database export belong to the next backup.

The dated ZIP under `.wrangler/backups` contains database.sql (all database tables), media files and their original keys/MIME metadata, current application source, original login-recovery secrets including AUTH_PEPPER, and a manifest with SHA-256 hashes. A separate .sha256 file protects the ZIP checksum. Archive contents are verified before success is reported. To check a copied ZIP later, run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-backup.ps1 -BackupZip "FULL_PATH_TO_ZIP"`, with the .sha256 file next to it. The mailbox password and Cloudflare credentials are not included; retain access to those accounts separately. If AUTH_PEPPER or JWT_SECRET is rotated, update the private bootstrap state used by this command.

Copy the ZIP and checksum to a private USB/external drive or your own private cloud storage every time. A copy only on this PC does not protect against losing the PC. Keep at least 7 daily copies and 4 weekly copies. The script never deletes older backups. The archive is not encrypted and includes personal gym records, private documents, and secrets: keep it private and encrypt before sharing with a trusted technician.

Cloudflare D1 Free also provides automatic Time Travel for 7 days. It is an extra database recovery option, not an independent backup of uploads or protection against losing account access.

## Recovery

Restore to a NEW database and KV namespace first; do not overwrite production or run setup:cf:remote on a restored database.

1. Extract the ZIP and verify the file hashes in manifest.json. Import database.sql into temporary SQLite and run PRAGMA integrity_check to validate it.
2. Create new D1 and import: `npx wrangler d1 execute NEW_DATABASE --remote --file PATH_TO_database.sql`.
3. Create new KV. For each entry in media-index.json, upload its binary file with its ORIGINAL key and metadata: `npx wrangler kv key put KEY --namespace-id NEW_NAMESPACE_ID --remote --path FILE --metadata JSON_METADATA`. Preserve an expiration only if still in the future. Original keys keep saved image URLs working.
4. Install the backed-up app with `npm ci`. Update wrangler.jsonc account/database/namespace IDs. Restore authentication secrets with `npx wrangler secret bulk PATH_TO_recovery-secrets.json`. Configure SMTP_PASS separately if needed. Never publish secret values.
5. Deploy to a temporary Worker address. Verify admin/member logins, members, payments, attendance, settings, and uploaded documents against the backup. Switch domain routes only after verification.

Time Travel can undo a recent mistaken database edit but overwrites database state. Take a fresh backup first and select the recovery timestamp carefully.

Official docs: https://developers.cloudflare.com/d1/reference/time-travel/
