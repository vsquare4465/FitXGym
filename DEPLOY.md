# Production deployment

The production app now targets Cloudflare **Workers Free + D1 + KV** and runs independently of any PC. Follow [GO-LIVE.md](./GO-LIVE.md) for deployment, domain activation, credentials, messaging, free-tier limits, and backup instructions.

Use `npm run db:cf:remote` followed by `npm run deploy:cf` for updates. The Cloudflare configuration contains no paid Containers. The earlier Docker/Tunnel deployment is a legacy option and is not required.
