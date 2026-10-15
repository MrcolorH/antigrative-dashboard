import { AntigravityClient } from '../sidecars/panel/client.mjs';
import { MetricsStore } from '../sidecars/panel/store.mjs';
import { DesktopUsage } from '../sidecars/panel/usage.mjs';

async function main() {
  try {
    const client = new AntigravityClient();
    const store = new MetricsStore(client);
    await store.refreshQuota(true);
    if (store.identity) {
      const usage = new DesktopUsage(store);
      await usage.sync(true);
      const summary = await usage.ledger.summary(store.identity);
      console.log(`[Antigrative Dashboard] 历史用量统计完成：共 ${summary.requests} 次请求，${summary.totalTokens} Token，覆盖 ${summary.days.length} 天。`);
    }
  } catch (error) {
    // Antigravity not currently running; sidecar will automatically backfill upon launch.
  }
}

void main();
