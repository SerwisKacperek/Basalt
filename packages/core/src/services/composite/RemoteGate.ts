/**
 * Fire-and-forget gate for best-effort remote writes.
 *
 * Remote sync is optional in the local-first model: writes always succeed
 * locally and are mirrored to the backend when reachable. When the backend is
 * unreachable, this gate stops hammering it (so a single drag-reorder doesn't
 * fire dozens of doomed requests) and logs a single warning per cooldown
 * instead of an error per call.
 */
export class RemoteGate {
  private pausedUntil = 0;

  constructor(
    private readonly label: string,
    private readonly cooldownMs = 30_000,
  ) {}

  /** Run a remote write, unless the remote is currently in cooldown. */
  run(action: () => Promise<unknown>): void {
    if (Date.now() < this.pausedUntil) return;
    action().catch(() => {
      if (Date.now() >= this.pausedUntil) {
        console.warn(
          `[${this.label}] remote unavailable — pausing remote sync for ${
            this.cooldownMs / 1000
          }s`,
        );
      }
      this.pausedUntil = Date.now() + this.cooldownMs;
    });
  }
}
