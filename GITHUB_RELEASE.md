# Antigrative Dashboard v0.8.1

## Teamwork and nested subagents — Issue #9

- Match the active composer's own visible editor and controls. Ignore hidden/inert editors and descendants owned by deeper agent inputs.
- Recognize send, stop, cancel, tooltip and English/Chinese ARIA control semantics. Generation no longer invalidates the composer solely because its action button changes.
- Discover static icon/text badges without requiring title/span; measure painted text safely and reject ambiguous anchors.
- Prefer the current composer's nearest valid data-cascade-id over the parent route. Invalid explicit IDs clear conversation statistics; late responses cannot overwrite the current agent's metrics.

## Usage-window lifecycle and language fixes

- Recreate the strip and usage controller together after a closed-dialog composer teardown. Fix **View token usage** becoming unresponsive after subagent navigation.
- Invalidate pending requests from discarded mounts.
- Context language choices update Today / This month / View token usage immediately and keep the statistics window synchronized.
- Preserve an already-open account usage window across composer replacement and pointer/keyboard hover dismissal when returning to chat.

## CLI current-request cache percentages

- Prioritize cache percentage, with read tokens as secondary text when terminal width permits.
- Support empirically checked CLI 1.3.2/1.3.3 Sonnet 4.6 and GPT-OSS 120B scopes, plus CLI 1.3.3 Gemini 3.8 Flash (High), with zero cache writes. Use cacheRead / (input + cacheRead) for these scopes.
- Busy/tool/initializing zero-cache snapshots show **Cache --**, instead of treating temporary zero counters as completed 0% hits. Valid idle zero reads still show 0%; available nonzero busy counters remain usable.
- Unknown semantics remain unavailable. Do not borrow a previous request's percentage or include output tokens in the denominator.

See [CLI counter semantics](https://github.com/YOU-SHOULD-KNOW-ME/antigrative-dashboard/blob/v0.8.1/docs/CLI.md). CLI tok/s still requires streaming-duration data absent from the documented payload.

## Downloads and update

- **App / CLI:** antigrative-dashboard-0.8.1.zip and .zip.sha256. Extract and run `python manage.py install` for App or `python manage.py install-cli` for CLI. Use python3 on Linux/macOS. Confirm your host before choosing the installer.
- **Standalone Antigravity IDE:** antigrative-dashboard-ide-0.8.1.vsix and .vsix.sha256. Use **Install from VSIX...** and retain the documented loopback remote-debugging launch flags.

Plugin identity, preferences and recorded usage are retained. Shared usage fixes are included in the IDE package; desktop Teamwork discovery belongs to the App adapter. VS Code, Visual Studio, JetBrains, Zed and Xcode integrations remain unsupported.

## Verification scope

Windows real App checks cover main-to-three-level subagent delegation, independent metrics, return navigation and a generating-state screenshot. Real App usage checks confirm opening and English/Chinese synchronization. Chromium regressions cover six-level nested DOM, unchanged-route ownership, working controls, late responses, ambiguity and main/subagent usage remounts. Shared usage tests cover App and IDE, including Trusted Types.

CLI numerical tests cover Windows and Linux, with tested server CLI/model samples. Publication is gated by Windows/Linux/macOS data, lifecycle, Chromium, package and official desktop resource checks. Signed-in Linux/macOS GUI acceptance remains outstanding; fixtures do not establish support for every future host layout.

## 中文摘要

修复 Issue #9：Teamwork 与多层子代理的输入框定位、生成时控件消失、无 title/span 徽章异常，以及子代理会话归属和旧请求串数据问题。额外修复切换子代理后「查看用量统计」失效，以及从上下文详情切换中英文后用量入口和统计页面不同步。

CLI 新增已实测口径的当前请求缓存率；运行或工具执行期间的临时零值显示「Cache --」，不再误报完成请求的 0%。未知口径保留不可用，不借用上一轮数据。

提供 App/CLI ZIP 与独立 IDE VSIX，保留已有偏好和用量记录；其他编辑器扩展尚未兼容。
