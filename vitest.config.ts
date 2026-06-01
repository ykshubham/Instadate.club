import path from 'node:path';
import { defineWorkersConfig, readD1Migrations } from '@cloudflare/vitest-pool-workers/config';

// Two test surfaces share one runner:
//   • tests/unit      → plain runtime, pure functions, no bindings (fast).
//   • tests/{integration,api,security} → real workerd + Miniflare D1, with all
//     ./migrations applied to a throwaway in-memory database before each file.
//
// The D1 migrations are read at config time and handed to the test worker via a
// binding (TEST_MIGRATIONS); tests/apply-migrations.ts runs them in beforeAll.
export default defineWorkersConfig(async () => {
  const migrations = await readD1Migrations(path.join(__dirname, 'migrations'));

  return {
    test: {
      // Per-file isolated storage so one test's writes never leak into another.
      poolOptions: {
        workers: {
          isolatedStorage: true,
          singleWorker: false,
          miniflare: {
            compatibilityDate: '2024-11-01',
            compatibilityFlags: ['nodejs_compat'],
            d1Databases: { DB: 'test-db' },
            r2Buckets: ['PROFILE_IMAGES'],
            bindings: {
              TEST_MIGRATIONS: migrations,
              ADMIN_USER_IDS: 'admin-seed',
              // Override .dev.vars: keep test DBs empty/deterministic (no auto-seed).
              DATABASE_EMPTY: 'false',
              ENVIRONMENT: 'test'
            }
          },
          // Point the pool at the real Worker entry so SELF.fetch() exercises it.
          main: path.join(__dirname, 'worker', 'index.ts'),
          wrangler: { configPath: path.join(__dirname, 'wrangler.jsonc') }
        }
      },
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            include: ['tests/unit/**/*.test.ts'],
            // Pure functions only — opt out of the workers pool for speed.
            pool: 'forks',
            poolOptions: { workers: undefined as any },
            environment: 'node'
          }
        },
        {
          extends: true,
          test: {
            name: 'worker',
            include: ['tests/{integration,api,security}/**/*.test.ts'],
            setupFiles: ['tests/apply-migrations.ts']
          }
        }
      ],
      coverage: {
        provider: 'istanbul',
        reporter: ['text', 'text-summary', 'html', 'json-summary'],
        reportsDirectory: './coverage',
        // Gate the security-critical + core service surface that the suites
        // directly target. The 3k-line router worker/index.ts is exercised
        // end-to-end by the api/security suites (auth, chat, reports, admin,
        // updates, soft-delete, rate-limit, status gates) but is intentionally
        // NOT line-gated here: gating a monolith full of untested feature routes
        // (discovery, recommendations, events scoring, dashboards, seeder) would
        // force a meaningless global floor. Behavior is covered; lines are not.
        include: [
          'worker/auth.ts',
          'worker/authz.ts',
          'worker/dto.ts',
          'worker/visibility.ts',
          'worker/services/ratelimit.ts',
          'worker/services/chat.ts',
          'worker/services/moderation.ts',
          'worker/services/admin.ts',
          'worker/services/otp.ts',
          'worker/services/connections.ts',
          'worker/services/trust.ts'
        ],
        exclude: ['worker/**/*.d.ts', 'tests/**'],
        thresholds: {
          // Global floor across the gated set (regression guard).
          lines: 82,
          functions: 85,
          statements: 82,
          branches: 68,
          // Per-file hard gates — set just under current actuals so a drop fails CI.
          'worker/auth.ts': { lines: 90, functions: 95, statements: 90, branches: 85 },
          'worker/authz.ts': { lines: 70, functions: 60, statements: 70, branches: 65 },
          'worker/dto.ts': { lines: 100, functions: 100, statements: 100, branches: 100 },
          'worker/visibility.ts': { lines: 100, functions: 100, statements: 100, branches: 95 },
          'worker/services/ratelimit.ts': { lines: 90, functions: 100, statements: 90, branches: 65 },
          'worker/services/chat.ts': { lines: 100, functions: 100, statements: 95, branches: 85 },
          'worker/services/moderation.ts': { lines: 95, functions: 100, statements: 95, branches: 90 },
          'worker/services/admin.ts': { lines: 70, functions: 80, statements: 70, branches: 55 },
          'worker/services/connections.ts': { lines: 90, functions: 90, statements: 88, branches: 60 },
          'worker/services/otp.ts': { lines: 85, functions: 100, statements: 80, branches: 60 },
          'worker/services/trust.ts': { lines: 72, functions: 75, statements: 72, branches: 60 }
        }
      }
    }
  };
});
