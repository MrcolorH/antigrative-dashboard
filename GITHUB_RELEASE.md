# Antigrative Dashboard v0.8.5

## Long conversations: missing speed, cache and context

A user reported that a conversation with a large processed corpus stopped showing all three statistics, while account quota and saved monthly usage still worked. The screenshot explicitly reported the collector's response-size limit. This is not evidence that the model context window was full.

- Stop polling `GetCascadeTrajectory` for statistics. Read conversation summaries and the distinct step/generator-metadata offset interfaces instead; generator requests set `includeMessages: false`.
- Reuse complete, projected immutable prefixes. Revalidate the last model request and unresolved timed tools; periodically check settled tails. Explicit refresh, rewinds, changed settled histories, account changes and backend changes invalidate the relevant cache.
- Validate and project JSON as it arrives. Skip prompts, attachments and tool/executor output without buffering their contents; retain only statistical fields and the minimal step semantics needed for tool-only timing classification.
- Remove the provisional 512 MiB whole-response cap for successful statistical streams. An 8 MiB projected-statistics/cache budget, bounded parser depth/fields and timeouts remain. Over-budget or inconsistent pages fail explicitly and cannot overwrite a complete cached revision.
- Preserve request deduplication, timing classification, token/cache/context values, local usage identities and persisted preferences. Error messages are localized.

## Evidence and limits

The 8 MiB budget is an engineering choice informed by isolated local HTTP experiments, not an optimal universal number or exact heap guarantee. A 640 MiB artificial text stream with 1,024 request records succeeded while keeping about 0.49 MiB of serialized statistics. The 16,384-record case retained about 7.92 MiB and added roughly 48 MiB sampled heap; the 32,768-record case is rejected under the selected budget. Numeric results remain correct. Resource workload commands and measurements are documented in [LONG_CONVERSATIONS.md](https://github.com/YOU-SHOULD-KNOW-ME/antigrative-dashboard/blob/main/docs/LONG_CONVERSATIONS.md).

The host exposes offsets but no requested page-size field. A cold step page can still contain large text. This release streams and discards it; it does not claim that the host always returns fixed-size or body-free pages. Generator requests disable message contents. Unknown associations cause conservative re-reads. Stats larger than the memory budget or acquisitions exceeding timeouts remain explicit limitations.

Signed-in Windows App checks compared every metric and usage record with the full reference for a 27-request conversation: identical. Automated regressions cover large HTTP pages, pagination, evolving records, late tools, rewinds, cache eviction, scope changes and malformed streams. Release gates run Windows/Linux/macOS automated tests and the 640 MiB/over-budget experiments, plus official desktop resource checks. The reporting user's exact original conversation and signed-in Linux/macOS GUI operation remain separate, unverified acceptance scopes.

## Downloads and update

- **Desktop App / CLI:** `antigrative-dashboard-0.8.5.zip` and its `.sha256`. Extract and use `python manage.py install` for App, or `python manage.py install-cli` for CLI; Linux/macOS use `python3`.
- **Standalone Antigravity IDE:** `antigrative-dashboard-ide-0.8.5.vsix` and its `.sha256`. Install from VSIX; retain the documented debugging launch flags.

Desktop App and standalone IDE include the shared collector repair. CLI functionality is unchanged. Fully quit and reopen the host after installation so its collector loads the new modules. Language preferences, saved statistics and usage records are retained. Other editor integrations remain unsupported.

## 中文摘要

修复长对话出现“会话数据超过采集上限”后速率、缓存和上下文全部空白的问题：停止整包对话轮询，使用独立偏移分页和增量读取；大段文本、附件和工具输出边读边跳过，保留计时判定需要的最小字段。

移除过渡版 512MiB 整包响应限制，改用有资源实验依据的 8MiB 统计缓存预算，并保留解析和超时保护。640MiB 人工内容响应测试通过，本地真实对话统计与参考结果一致。官方接口不能指定页大小，冷启动仍可能收到较大的步骤页；反馈用户的原始对话仍需实际验收。

桌面 App 与独立 IDE 同步共享采集修复，CLI 功能不变。安装后完整退出并重新打开宿主，已有语言、统计和用量记录保留。
