# Antigrative Dashboard v0.8.2

## Cold-start recovery

- Separate application/RPC errors from endpoint loss. An unavailable historical conversation, ordinary API error or malformed response no longer clears a healthy endpoint and triggers another process scan.
- Coalesce concurrent discovery. Failed cold starts use a 3-second initial delay with exponential backoff capped at 30 seconds. Connection refusal/reset and credential failures still recover automatically, with a scan cooldown.
- A late failure from an old endpoint cannot invalidate a newly discovered endpoint. Existing PID/port/credential pairing and loopback restrictions remain in place.
- Track top-frame navigation and trusted default contexts, including context creation arriving before navigation. If hooks exist without a tracked main context, resynchronize Runtime events on the same socket.
- Reject prior contexts at navigation and remove a failed session's preload before reconnecting, so repeated navigation errors do not accumulate injection scripts.

The renderer already waits for the DOM and observes composer creation; this release does not assume every loading delay is a renderer bug. Historical usage import remains enabled, with conversation errors isolated from connection recovery.

## Verification and limits

- Local HTTP regressions cover unavailable history, malformed responses, concurrent discovery, cold-start/auth cooldown and backend port/PID restarts.
- In the synthetic application-error scenario, process discovery drops from 39 scans to 1; this is a regression result, not a measurement of the reporting user's machine.
- Real Chromium/CDP tests cover five rounds of delayed composer creation and interrupted startup navigation, recovering live metrics without disable/enable.
- Protocol fixtures cover top-frame replacement, reversed event order, missing context events, and remote/iframe exclusion.
- The remount hover regression moves the pointer away before restoring controls, isolating cancellation of the removed control's timer from a legitimate new pointer entry.
- Publication requires Windows/Linux/macOS automated tests, package checks and official desktop resource checks. The reporting user's exact environment and original failure remain unverified; signed-in Linux/macOS GUI acceptance is still outstanding.

## Downloads and update

- **Desktop App / CLI:** `antigrative-dashboard-0.8.2.zip` and `.zip.sha256`. Extract and use `python manage.py install` for App or `python manage.py install-cli` for CLI. Use python3 on Linux/macOS.
- **Standalone Antigravity IDE:** `antigrative-dashboard-ide-0.8.2.vsix` and `.vsix.sha256`. Install from VSIX and retain the documented loopback debugging launch flags. Shared client/runtime fixes are included; these changes were not diagnosed as an IDE-specific report.

After installing the App/IDE update, fully quit and reopen the host so its collector loads the new modules. No language preferences, historical statistics or usage-ledger data are cleared. CLI metrics and rendering are unchanged from v0.8.1. Other editor integrations remain unsupported.

## Report a recurring problem

Please [open an Issue](https://github.com/YOU-SHOULD-KNOW-ME/antigrative-dashboard/issues/new) with the OS/version, host type (App/IDE/CLI), host and plugin versions, installation method, reproduction steps/frequency, exact error text, screenshots and relevant logs. Mention whether disable/enable or restart restores operation. Redact credentials, account details and private conversation contents before posting public logs.

## 中文摘要

本版针对冷启动会话发现与注入恢复进行加固：区分会话／接口错误和后台连接失效，避免历史请求报错触发反复进程重扫；合并并发扫描，失败时以 3～30 秒退避重试；页面初始跳转后重新同步主渲染上下文，并清理失败的注入脚本。

更新后请完整退出并重新打开 App／IDE，以加载新的采集模块。保留语言设置、历史统计和用量记录，不会清空本地数据。用户原始故障仍需结合其版本和日志进一步确认。

若再次遇到类似问题，请到项目下提交 Issue，并尽量附上系统和版本、使用端、宿主与插件版本、安装方式、复现步骤和频率、错误提示、截图及相关日志，以及禁用／启用或重启是否能恢复。公开日志前请遮盖凭据、账号和对话隐私。
