// Setup file for the `worker` project (integration / api / security).
// Applies every migration in ./migrations to the isolated test D1 before the
// suite runs, so each test file sees the real production schema.
import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll } from 'vitest';

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});
