import { DurableObject } from "cloudflare:workers";

const PORT = 3001;
/** Stays up through a normal desk session, then stops so quiet hours are not billed. */
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

const PASSED_ENV = [
  "DATABASE_URL",
  "JWT_SECRET",
  "PUBLIC_SITE_URL",
  "ALLOWED_ORIGINS",
  "SEED_OWNER1_EMAIL",
  "SEED_OWNER1_PASSWORD",
  "SEED_OWNER1_NAME",
  "SEED_DEMO_DATA",
  "SEED_SYNC_OWNER_PASSWORD",
  "OTP_FROM_EMAIL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_SECURE",
  "MAIL_PASSWORD",
  "RESEND_API_KEY",
  "WHATSAPP_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "CALLMEBOT_APIKEY",
  "FAST2SMS_API_KEY",
];

function containerEnv(env) {
  const out = {
    NODE_ENV: "production",
    PORT: String(PORT),
    TRUST_PROXY: "true",
    DIST_PATH: "/app/dist",
    SEED_DEMO_DATA: env.SEED_DEMO_DATA || "false",
  };
  for (const key of PASSED_ENV) {
    const value = env[key];
    if (value) out[key] = String(value);
  }
  return out;
}

export class GymApp extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.starting = undefined;
    this.ready = false;
    this.monitoring = undefined;
    const container = ctx.container;
    if (container?.running) {
      void ctx.blockConcurrencyWhile(() =>
        container.setInactivityTimeout(INACTIVITY_TIMEOUT_MS),
      );
    }
  }

  async fetch(request) {
    if (!this.ready || !this.ctx.container?.running) {
      this.starting ??= this.startAndWaitForPort().finally(() => {
        this.starting = undefined;
      });
      await this.starting;
      this.ready = true;
    }

    const url = new URL(request.url);
    url.protocol = "http:";
    url.host = "container";
    const forwarded = new Request(url, request);
    forwarded.headers.delete("host");
    const clientIp = request.headers.get("cf-connecting-ip");
    if (clientIp) forwarded.headers.set("x-forwarded-for", clientIp);
    forwarded.headers.set("x-forwarded-proto", "https");
    return this.ctx.container.getTcpPort(PORT).fetch(forwarded);
  }

  async startAndWaitForPort() {
    const container = this.ctx.container;
    if (!container) throw new Error("Container binding is missing");

    if (!container.running) {
      const image = container.images?.base;
      if (!image) throw new Error("Container image 'base' is not configured");
      container.start({
        image,
        // 1 GiB — Node + Prisma does not stay up in the 256 MiB "lite" size.
        instance: { vcpu: 0.25, memoryMib: 1024, diskMb: 4000 },
        enableInternet: true,
        env: containerEnv(this.env),
      });
    }

    this.observeExit();
    await container.setInactivityTimeout(INACTIVITY_TIMEOUT_MS);

    const port = container.getTcpPort(PORT);
    let lastError;
    for (let attempt = 0; attempt < 90; attempt++) {
      try {
        const response = await port.fetch("http://container/api/health", {
          signal: AbortSignal.timeout(2000),
        });
        await response.body?.cancel();
        return;
      } catch (error) {
        lastError = error;
        await scheduler.wait(1000);
      }
    }
    throw new Error("Fit X Gym container did not become ready on port 3001", {
      cause: lastError,
    });
  }

  observeExit() {
    if (this.monitoring) return;
    this.monitoring = this.ctx.container
      .monitor()
      .then(() => console.log("Fit X Gym container exited"))
      .catch((error) => console.error("Fit X Gym container failed:", error))
      .finally(() => {
        this.monitoring = undefined;
        this.ready = false;
      });
    this.ctx.waitUntil(this.monitoring);
  }
}

export default {
  async fetch(request, env) {
    return env.GYM_APP.getByName("fitx-gym").fetch(request);
  },
};
