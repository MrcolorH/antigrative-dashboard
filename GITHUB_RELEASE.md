# Antigrative Dashboard v0.8.4

## Issue #11 — Windows discovery and frozen sidecar panels

- Keep netstat as the normal socket source. If it fails or provides no listening socket for a candidate, run one asynchronous, hidden and time-bounded Get-NetTCPConnection query for all missing PIDs. Avoid per-process PowerShell loops.
- Recognize localized listening states and try the Windows .gemini/antigravity/logs/language_server.log location after the profile log. Explicit log overrides remain authoritative.
- A log port still has to belong to the detected standalone backend PID before it can be paired with that process's credential. Do not accept an unverified log-only port.
- Serve a self-contained classic JavaScript panel bundle instead of importing ESM dependencies from plugin://. Both the SDK sidecar and standalone preview use the same bundle generator.
- Defer the entry script, wait for DOM readiness, guard missing widgets and prevent duplicate initialization.

## Persistent App side panel

- Speed, cache and context cards remain visible and double as detail tabs. The default speed details are shown immediately; there is no large empty hover placeholder.
- Five-hour and weekly quota summaries stay visible while inspecting any metric.
- Click to switch details. Pointer departure no longer hides the selected information. Arrow/Home/End keyboard navigation and focusable detail panels are supported.
- Keep the outer frame stable across detail/language changes. Long content scrolls within the detail panel. The layout was checked at 280/360/440-pixel browser widths and in the real App's narrow pane.
- Theme/background/accent adaptation continues to work. The iframe background also follows the derived dashboard theme despite the SDK's inline body styling.

Open it from the right auxiliary pane: **+ → Extensions → Antigrative Dashboard**. The input-strip hover cards and Token usage window remain separate views.

## Coherent resource updates

Panel HTML gives its script and styles the same content-based version, including layout, translations, theme source and CSS. Resource responses use no-store headers. This prevents a new layout being combined with cached older JavaScript/styles, which caused raw translation keys and broken layout during local review.

## Verification scope

Windows signed-in plugin:// checks reproduced the old uninitialized module panel, then verified the restarted classic/deferred panel with real metrics matching the inline strip, quota details, language switching and manual refresh. Real speed/cache/context tab switches retain the same outer dimensions; the reporting user's original machine is a separate acceptance scope.

Browser regressions cover opaque sandboxed frames, ordinary and early classic loading, deferred startup, data/cache/context/quota display, automatic recovery, duplicate scripts, language/manual refresh, stable geometry, keyboard selection, internal scrolling and stale unversioned resource rejection. Shared theme/custom-color and persisted-language checks are included. Publication requires Windows/Linux/macOS CI and official desktop resource checks; signed-in Linux/macOS GUI acceptance remains outstanding.

## Downloads and update

- **Desktop App / CLI:** antigrative-dashboard-0.8.4.zip and .zip.sha256. Extract and run `python manage.py install` for App or `python manage.py install-cli` for CLI (python3 on Linux/macOS).
- **Standalone Antigravity IDE:** antigrative-dashboard-ide-0.8.4.vsix and .vsix.sha256. Use Install from VSIX... and retain the documented loopback debugging launch flags.

Fully quit and reopen App/IDE after installing updated collector code. Language preferences, saved statistics and usage records are retained. The redesigned side panel belongs to the desktop App; IDE receives the shared discovery/platform changes. CLI functionality is unchanged. Other editor integrations remain unsupported.

## 中文摘要

修复 Issue #11：Windows 端口列表为空时增加一次受限的 PID 兜底查询和日志路径回退，继续校验端口归属；侧栏改用自包含普通脚本，配合 defer、DOM 就绪和重复初始化保护，解决 plugin:// 模块加载限制及初始化中断。

侧栏重新设计为常驻仪表盘：关键数据和共享额度持续显示，点击切换详情，鼠标移开不再消失；外框尺寸稳定，长内容内部滚动，并跟随宿主主题。脚本与样式按内容统一换版本，修复更新时新旧资源混用导致的翻译键外露和排版错乱。

入口：右侧辅助栏顶部「＋ → Extensions → Antigrative Dashboard」。安装后请完整退出并重新打开宿主，保留已有语言、统计与用量数据。桌面 App 已完成本地实机验收；IDE 同步共享发现修复，CLI 功能不变。
