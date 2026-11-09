import { vi } from "vitest";

// The Server Functions need a session and a database; unit tests talk to fakes instead.
// Tests that care about a call read the mocks (`vi.mocked(applyCommands)`).
vi.mock("@/features/sync/infrastructure/actions", async () => {
  const { blank } = await import("@/features/state/domain/state");
  const { withSyncedName } = await import("@/features/state/domain/with-synced-name");
  return {
    applyCommands: vi.fn(async () => ({ ok: true })),
    loadMyState: vi.fn(async () => ({ ok: true, state: withSyncedName(blank()) })),
  };
});
