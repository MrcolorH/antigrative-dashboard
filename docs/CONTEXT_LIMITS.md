# Context occupancy, provider references and compaction

## What the percentage means

The main context percentage remains:

`estimatedTokensUsed / maxContextTokens`

Both counters come from the current request's Antigravity `contextWindowMetadata`. The denominator is the host's active window, not a guessed provider specification. A valid host limit is never replaced by a larger model catalog value. Missing/invalid/zero host limits leave the percentage unavailable; a known provider model cannot fabricate it. Zero usage remains zero, and over-capacity estimates remain visible as such.

## Separate reference information

The details distinguish:

1. **Active window (host):** the reported capacity used by this session.
2. **Provider capacity reference:** a sourced upstream specification for an exactly identified model. It does not promise that this account, host, mode or request can use that capacity. Gemini's published input budget and a combined context window are not interchangeable.
3. **Compaction threshold:** unknown unless a reliable host-specific source establishes the trigger. `maxContextTokens` alone is not evidence of such a threshold. The current inspected schema provides only `estimatedTokensUsed` and `maxContextTokens`, so this implementation does not claim fixed 256K/160K/80K triggers.

References checked on **2026-10-14**:

| Exact model family | Published reference | Source |
| --- | --- | --- |
| Gemini 3.8 Flash | Input limit 1,048,576 | [Google model specification](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash) |
| GPT-OSS 120B | Context window 131,072 | [OpenAI model specification](https://developers.openai.com/api/docs/models/gpt-oss-120b) |
| Claude Sonnet 4.6 | 1M | [Anthropic model specification](https://platform.claude.com/docs/en/models/sonnet-4-6/overview) |
| Claude Opus 4.6 | 1M | [Anthropic context-window documentation](https://platform.claude.com/docs/en/build-with-claude/context-windows) |
| Claude Sonnet 5.5 | 1M | [Anthropic model specification](https://platform.claude.com/docs/en/models/sonnet-5-5/overview) |
| Claude Opus 5.5 | 1M | [Anthropic model specification](https://platform.claude.com/docs/en/models/opus-5-5/overview) |

Claude references retain the literal published `1M` label; they are not converted into a guessed precise 1,048,576-token figure. The raw numeric provider-reference field is null for these label-only entries. References are static, dated documentation lookups, not a live capabilities query.

## Model recognition

Version spellings such as `claude-sonnet-5.5` and `claude-sonnet-5-5` normalize consistently. The parser preserves explicit thinking/effort labels; it does not invent them for every model. Exact unrecognized models, custom suffixes, TTS variants, incomplete family names and unknown placeholders do not inherit another model's reference.

Host enum aliases were checked against the installed App's model catalog on the same date: M318 = Gemini High, M319 = Medium, **M320 = Low**, M35 = Claude Sonnet 4.6 (Thinking), M26 = Claude Opus 4.6 (Thinking). M317 is not assumed to be Gemini Low. Alias mappings can change in future host versions; the active percentage still uses the host counters even if a reference alias later becomes outdated.

## Persistence and verification

Saved context restores its host counters and recalculates ratios, remaining tokens and provider references from the recognized model. Arbitrary saved source URLs, thresholds, ratios and unknown fields are not trusted or copied. Earlier records lacking reference fields remain supported. No request timing, token usage, cache calculation or account-quota semantics change.

Regressions cover host/reference disagreement, missing and invalid counters, zero and over-capacity usage, alias equivalence, unsupported variants, restart restoration and malicious/corrupt saved fields. Browser tests check English/Chinese display, stable panels and unchanged occupancy. A signed-in local conversation validates that occupancy retains the original host denominator. These checks do not establish a universal platform compaction threshold or signed-in Linux/macOS GUI compatibility.

## 中文说明

控件百分比仍使用宿主返回的「当前已用量 ÷ 当前窗口容量」。供应商容量在详情里单独标为参考，不覆盖当前会话的分母；原生规格、当前产品窗口和压缩触发阈值是不同概念。未核实的压缩阈值显示「未知」，不套用固定数值。

模型 ID 的小数点和连字符写法统一解析，精确识别已核实型号；未知型号不继承其他型号的容量。恢复保存记录时重新计算派生值，并拒绝任意来源 URL、非法阈值和未知字段。
