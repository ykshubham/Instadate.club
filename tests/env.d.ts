// Types for the Cloudflare Workers test pool. Augments `cloudflare:test`'s
// ProvidedEnv with the worker's own bindings plus the injected migrations list.
import type { D1Migration } from 'cloudflare:test';

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database;
    PROFILE_IMAGES: R2Bucket;
    CHAT_ROOM: DurableObjectNamespace;
    ADMIN_USER_IDS: string;
    TEST_MIGRATIONS: D1Migration[];
  }
}
