# Antigrative Dashboard v0.7.0

## Standalone Antigravity IDE adapter

- Add a dedicated VSIX for Google's own Antigravity IDE. Its narrow Agent input
  shows three interactive icons; widening the pane reveals numeric summaries.
  Native controls keep their space and the dashboard hides only when the icons
  cannot fit safely.
- Read speed, cache, context and account quotas from the IDE's main language
  server. Bind each input to its actual conversation, reject stale/other-profile
  sources, and restore saved statistics without guessing the most recent chat.
- Count tool follow-up requests separately even when they share an execution ID.
  Prefer response/message IDs for deduplication, preserving real cache reads.
- Render fixed templates with DOM operations under the IDE's existing Trusted
  Types policy. Preserve hover-card scroll, focus and menus across unchanged polls.
- Retain theme adaptation, saved English/Chinese choices and first-use guidance.
  Updates preserve the extension identity and user global-storage directory.
- Include a host-checked Python install/launch/uninstall helper using the IDE's
  bundled runtime, a complete allowlisted VSIX and SHA256 checksums. Fresh health
  reporting prevents old state files from appearing connected.

**Scope:** Windows 11 / Antigravity IDE 2.5.5 has passed real local use. Linux/macOS
have automated process/installer/package/browser coverage; signed-in IDE GUI
acceptance is still outstanding. VS Code, Visual Studio, JetBrains, Zed and Xcode
extensions are not supported by this adapter. Default IDE profiles only.

## Hover improvements from PR #7

Thanks to @qwqZYLqwq for the hover interaction contribution.
First hover waits 250ms; moving between cards is immediate while warm. Leaving
has a 120ms grace period and a 350ms warm window. Click and keyboard focus remain
immediate. Delayed tasks are cancelled on navigation, unmount and disposal;
16 production-widget browser cases cover the behavior, including macOS timing.

## Downloads and installation

- **Desktop App / CLI:** `antigrative-dashboard-0.7.0.zip` and `.zip.sha256`.
  Extract and run `python manage.py install` for the App, or
  `python manage.py install-cli` for the CLI. Use `python3` on Linux/macOS.
- **Antigravity IDE:** `antigrative-dashboard-ide-0.7.0.vsix` and `.vsix.sha256`.
  Choose **Install from VSIX…** in the IDE's Extensions view. Then fully quit and
  start the IDE with `--remote-debugging-port=0 --remote-debugging-address=127.0.0.1`.
  Append these flags to your IDE shortcut for subsequent launches.

The IDE does not require the desktop App. Ordinary launches without the flags
cannot attach the inline dashboard. The debugging endpoint stays on loopback;
application binaries and CSP settings remain untouched.
See [IDE installation and data cleanup](https://github.com/YOU-SHOULD-KNOW-ME/antigrative-dashboard/blob/v0.7.0/ide/README.md).

Publication requires Windows/Linux/macOS data, lifecycle, desktop/IDE Chromium
regressions and official desktop resource checks. Automated fixtures do not
replace signed-in Linux/macOS GUI acceptance. The existing desktop screenshots
illustrate the desktop widget; they are not IDE screenshots.

## 中文摘要

本版新增反重力自己的 **Antigravity IDE** 专用 VSIX。窄输入栏显示速率、缓存和
上下文三个图标，拉宽后显示详细数值；修复真实会话识别、工具跟进请求漏计及
悬浮卡轮询时反复刷新／滚动位置重置的问题。语言、引导和历史统计继续保留。

IDE 用户可直接安装 `.vsix`，无需桌面 App。安装后完全退出 IDE，用带上述两个
调试参数的快捷方式启动。Windows IDE 2.5.5 已实测；Linux/macOS IDE 的登录后
界面尚待实机验证。其他编辑器中的 Antigravity 扩展暂未兼容。

同时包含已合并 PR #7 的悬停优化及补充生命周期修复，感谢贡献者 @qwqZYLqwq。
