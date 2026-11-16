/// <reference types="@cloudflare/workers-types" />
declare module 'cloudflare:node' {
  export function httpServerHandler(options: { port: number }): { fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> };
}
