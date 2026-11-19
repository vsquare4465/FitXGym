# FitX Gym cloud backups

Private storage: https://github.com/vsquare4465/FitXGym-backups/actions

The workflow template in this folder is installed in that PRIVATE repository, not in the public app repository. It runs on GitHub-hosted Linux; the gym PC can be off. It is gated by repository variable `BACKUPS_ENABLED=true`. Until the Cloudflare token, billing safeguards and first real run have been checked, leave the variable false.

Schedule: Sunday 03:17 India time (Saturday 21:47 UTC). GitHub can delay scheduled jobs; this is not an exact-time guarantee. Latest eight successful copies are kept, each expiring after 56 days. With weekly backups, up to a week's changes can be lost. If all jobs fail for 56 days, artifacts will expire: check notifications and successful backup dates.

Contents: full D1 SQL, all KV media with original keys and MIME metadata, tracked app source from main, original AUTH_PEPPER/JWT_SECRET, and SHA-256 manifest. SMTP and Cloudflare credentials are excluded. The source commit is recorded; main must match the deployed app. D1/KV snapshots are not atomic together; quiet-hour scheduling and media-reference checks reduce that risk. D1 exports briefly lock database queries.

Each run restores the SQL into temporary SQLite, checks integrity/foreign keys and referenced media, creates a tar.gz, encrypts using AES-256-GCM, then decrypts/extracts and repeats verification before upload. Plaintext exists only in the ephemeral runner and is cleaned up after the backup process. Only encrypted files and their checksums are uploaded.

## One-time setup

- Create Cloudflare token restricted to the FitX account: Account / D1 / Edit (export requires it), Account / Workers KV Storage / Read. Save as `CLOUDFLARE_API_TOKEN` in private repository Actions secrets. Do not put credentials in chat, Git or workflow YAML.
- `FITX_RECOVERY_SECRETS` must contain the ORIGINAL production AUTH_PEPPER/JWT_SECRET JSON. Changing the pepper will break existing passwords. Update this backup secret if production authentication secrets rotate.
- `FITX_BACKUP_KEY` is a random 32-byte key encoded as 64 hex characters. Save a separate copy in a password manager or private Drive folder. GitHub secrets cannot be read back; losing the key makes backups unusable. Never rotate it without preserving the old key for old copies.
- Set a $0 GitHub Actions spending budget with Stop usage enabled, or have no payment method. GitHub allowances are account-wide. The workflow does not enable paid services. It caps each encrypted archive at 20 MiB (eight copies approximately 160 MiB; temporary upload headroom also needed) and each run at 15 minutes. It fails rather than automatically increasing limits. Other repositories can consume the same free allowance.
- Set GitHub Actions notifications for failed workflows in account notification settings and check the Actions page regularly. A disabled scheduler or exhausted quota may not produce a failed job notification.
- After setup, set `BACKUPS_ENABLED=true`, manually run **Weekly FitX backup**, and confirm a successful downloadable artifact. Do not treat setup as finished until this passes.

## Download and recover

1. Open the private repository Actions page, open a successful Weekly FitX backup run, and download its `fitx-backup-...` artifact. Extract GitHub's wrapper ZIP to get `.fitx` and `.sha256` files.
2. Use Node 22.13+ with the tools in this folder. Run `node backup/decrypt.mjs BACKUP.fitx PATH_TO_PRIVATE_KEY.txt OUTPUT.tar.gz`. The command refuses to overwrite an output file. AES-GCM rejects a wrong key or corrupted archive.
3. Extract `OUTPUT.tar.gz` privately (for example `tar -xzf OUTPUT.tar.gz`). Run `node backup/verify-data.mjs PATH_TO_EXTRACTED_backup` and compare file SHA-256 values with `manifest.json`.
4. Follow the included `RESTORE.txt` to restore into NEW D1/KV resources and validate the app before switching production. Never import over the live database without a deliberate recovery plan.

Download important copies elsewhere if you need to keep them beyond eight weeks. Store the recovery key separately from backup archives. Existing local manual ZIP backups remain available and are not encrypted by this job.
