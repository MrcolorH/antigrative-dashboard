# Local Token usage

This feature supports Antigravity desktop and its standalone IDE. Each uses its own data directory and local trajectories. The CLI is unchanged.

Open the database/cache icon, then **View token usage**. Activity provides daily and weekly contribution grids. Usage details provides day, week, and month stacked bars with model filters. Both follow the existing language and host theme.

On first opening, a compact introduction explains local history import, missing/deleted history, the difference from account billing, UTC+8 date boundaries, and local-only numeric storage. **Got it** saves acknowledgment independently of language and the language tip. Closing the window does not acknowledge it. Failed saves keep the introduction visible with a retry message. The desktop and IDE store their own completion state with their other preferences. In normal use, theme/language changes do not repeat an acknowledged introduction.

Local acceptance builds can set `window.__agPulseUsageGuidePreview = true` before mounting the widget to replay the introduction after a language or theme change. This flag does not clear the ledger and is not set by the packaged collectors.

The account-level usage window stays open through composer reflows and replacement. A temporarily missing usage snapshot masks totals until data returns; changing accounts resets filters and replaces the displayed data. Closing the window restores the strip to the current composer.

Charts use continuous flat-color stacks, with rounded outer top corners and inset separators. Segment heights retain their exact proportions, including small values. Lightweight legends filter models on click and highlight them on hover; tooltips include model shares. Theme changes update model colors immediately.

Model colors are generated from the current host accent and actual background. An analogous hue scale and tonal variation keep stacked series harmonious; chart marks maintain at least 3:1 contrast against the background. Model colors remain consistent across filtering, charts, legends, tooltips and table rows within the current theme. Custom accent/background changes regenerate the palette immediately; provider colors are not fixed.

## Accounting

- Total = uncached input + cache reads + cache writes + output. Output already includes thinking.
- Repeated reads upsert request records. Matching request IDs across conversation records count once per account.
- Token usage is independent of TPS timing-quality exclusions.
- Request creation time determines the date. If unavailable, the matching planner step's creation time is used. Undated requests contribute only to the all-time total and are identified separately.
- Date grouping uses Asia/Shanghai and Monday-start weeks.
- Local trajectories are backfilled on startup, then checked every 60 seconds. The current conversation is also ingested during ordinary metrics polling. Manual refresh starts a backfill; the sync indicator remains until it finishes.
- Only available local records can be recovered. Deleted/unavailable conversations or missing usage fields may leave gaps. This is local observed usage, not the provider's billing or account-wide consumption.

## Storage and privacy

The new `usage-v1` directory is separate from `history-v1` (latest conversation statistics). It retains request time, model, Token counters and hashed request identities for historical accumulation, isolated by hashed account and conversation identifiers. It does not retain prompts, replies, account emails or credentials.

For the IDE it lives in `User/globalStorage/you-should-know-me.antigrative-dashboard-ide/usage-v1` under the IDE profile. Desktop history is not copied or mixed into IDE totals.

Deleting `usage-v1` clears this ledger, but available local trajectories will be backfilled again while the plugin is enabled. Files are written atomically; incomplete fetches do not remove previously saved requests. Unreadable files are reported and preserved.

## Verification

`node --test sidecars/panel/tests/usage.test.mjs` checks persistence, deduplication, date attribution, account isolation, missing data, and accounting. `tools/check-usage-ui.mjs` exercises desktop entry, both charts, model filtering/colors, polling stability, transient missing snapshots, composer hiding/replacement, language/theme, narrow layout and dismissal using explicitly synthetic fixtures that never enter the user's ledger.

The usage UI regression also verifies first-use copy in English/Chinese, acknowledgment persistence across renderer replacement, save failure/retry, normal versus local replay behavior, and hover auto-dismissal after leaving the usage window. Preferences and bridge tests cover independent acknowledgment and allowlisted writes.

Run `node tools/check-usage-ui.mjs --ide` for the same usage interactions using the IDE DOM adapter under enforced Trusted Types and its CSP. `tools/check-ide-ui.mjs` additionally exercises the native narrow composer and conversation ownership.
