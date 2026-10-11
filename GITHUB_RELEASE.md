# Antigrative Dashboard v0.8.0

## Local Token usage for the App and standalone IDE

- Open the database/cache card and choose **View token usage**. Daily/weekly contribution grids and model charts by day, week and month show local recorded consumption, with model filtering and exact-count tables.
- Colors follow the host theme, accent and background. Custom year menus, stable window geometry, aligned controls and K/M/B formatting keep the interface consistent.
- The cache card includes a compact two-column **Today / This month** summary.
- First-use guidance explains local history import, incomplete coverage, UTC+8 date boundaries, storage and deletion. Acknowledgment survives restarts and language/theme changes; failed saves offer retry.
- Records are isolated by account. Available local history is imported and repeated requests are deduplicated. Deleting a conversation does not subtract previously recorded usage. Only numeric metadata and hashed identities are retained; prompts, replies and credentials are not stored.
- This is local observed usage, not an account bill. The desktop App and IDE use separate ledgers; missing/deleted history cannot be reconstructed.

## TPS timing quality - Issue #8

- Match output counters to request timing, reject conflicting duplicate/retry summaries, and quarantine conservative short tool-only and same-model statistical outliers.
- Preserve ordinary short responses and sustained high speeds. There is no fixed speed cap, fabricated duration or TTFT added to the streaming denominator.
- Show uncertain latest timing as unavailable instead of reusing an earlier speed. Token usage, cache and context remain available independently.
- Recalculate legacy saved rates when complete trajectories become readable. The host API does not expose chunk timing, so exact server generation time and buffering cannot be reconstructed.

See [TPS policy](https://github.com/YOU-SHOULD-KNOW-ME/antigrative-dashboard/blob/v0.8.0/docs/TPS.md) and [usage accounting and cleanup](https://github.com/YOU-SHOULD-KNOW-ME/antigrative-dashboard/blob/v0.8.0/docs/USAGE.md).

## Interaction fixes

- Keep the usage window open across polling, temporary missing snapshots and composer replacement; account switches clear stale displayed data.
- Queue manual refresh behind polling and complete its visible rotation.
- Restore pointer and keyboard focus correctly when closing usage. Hover cards auto-dismiss after the pointer leaves.
- Update English/Chinese README previews using the latest production widget and clearly labeled illustrative data.

## Downloads

- **Desktop App / CLI:** `antigrative-dashboard-0.8.0.zip` and `.zip.sha256`. Extract and run `python manage.py install` for the App or `python manage.py install-cli` for the CLI. Use `python3` on Linux/macOS. The CLI feature set is unchanged.
- **Standalone Antigravity IDE:** `antigrative-dashboard-ide-0.8.0.vsix` and `.vsix.sha256`. Choose **Install from VSIX...** in Extensions. Fully quit, then start with `--remote-debugging-port=0 --remote-debugging-address=127.0.0.1`; retain these flags on subsequent launches.

Updates retain the plugin identity, preferences and saved statistics. IDE users do not need the desktop App. VS Code, Visual Studio, JetBrains, Zed and Xcode integrations are not supported.

**Verification scope:** real local Windows App/IDE use plus automated data, lifecycle, package and Chromium regressions. Publication requires Windows/Linux/macOS CI and official desktop resource checks. Signed-in Linux/macOS GUI acceptance remains outstanding. README figures illustrate the desktop widget and are not live IDE screenshots.

## 中文摘要

本版为桌面 App 和独立 Antigravity IDE 增加本地 Token 用量统计：每日／每周活动格、按模型区分的天／周／月柱状图、主题配色和首次使用提示。缓存卡提供今日／本月入口。统计自动汇总可读取的本地历史，按请求去重；不保存对话正文，删除对话不会扣除已经记录的用量。这些统计不是账户账单，App 与 IDE 分开保存。

针对 Issue #8 加强 Token 与耗时配对，隔离计时可疑的样本，保留正常短回复与持续高速输出，不设置固定速率上限。异常计时不影响 Token、缓存或上下文统计。

同时修复用量窗口偶发消失、刷新动效不稳定、关闭统计页后悬浮卡不收起等问题，并更新中英文演示图。CLI 功能保持原有范围。Windows 本地已实测；Linux/macOS 有自动化覆盖，登录后 GUI 仍待实机验收。
