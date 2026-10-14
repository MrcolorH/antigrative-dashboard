// The host estimates the prompt at request start. This is not cumulative usage
// and not a per-token live meter. Known models resolve real capacity (e.g. Gemini 1M)
// when the host returns a generic fallback ceiling like 256K.
const count = value => (typeof value === 'number' || typeof value === 'string' && /^\d+$/.test(value)) && Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;

export function formatModelName(model) {
  if (typeof model !== 'string') return null;
  const trimmed = model.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  // Gemini 3.8 Flash with reasoning effort levels
  if (/model_placeholder_m319/i.test(trimmed)) return 'Gemini 3.8 Flash (Medium)';
  if (/model_placeholder_m318/i.test(trimmed)) return 'Gemini 3.8 Flash (High)';
  if (/model_placeholder_m317/i.test(trimmed)) return 'Gemini 3.8 Flash (Low)';
  if (/gemini.*3\.8.*flash.*medium|gemini-3\.8-flash-medium/i.test(lower)) return 'Gemini 3.8 Flash (Medium)';
  if (/gemini.*3\.8.*flash.*high|gemini-3\.8-flash-high/i.test(lower)) return 'Gemini 3.8 Flash (High)';
  if (/gemini.*3\.8.*flash.*low|gemini-3\.8-flash-low/i.test(lower)) return 'Gemini 3.8 Flash (Low)';
  if (/gemini.*3\.8.*flash|gemini-3\.8-flash-n/i.test(lower)) return 'Gemini 3.8 Flash';

  // Anthropic Claude 5.5 series (Thinking)
  if (/claude.*sonnet.*(?:5\.5|5-5)/i.test(lower)) return 'Claude Sonnet 5.5 (Thinking)';
  if (/claude.*opus.*(?:5\.5|5-5)/i.test(lower)) return 'Claude Opus 5.5 (Thinking)';

  // Anthropic Claude 4.6 series (Thinking)
  if (/claude.*sonnet.*(?:4\.6|4-6)|claude-sonnet-4/i.test(lower)) return 'Claude Sonnet 4.6 (Thinking)';
  if (/claude.*opus.*(?:4\.6|4-6)|claude-opus-4/i.test(lower)) return 'Claude Opus 4.6 (Thinking)';
  if (/claude.*sonnet/i.test(lower)) return 'Claude Sonnet (Thinking)';
  if (/claude.*opus/i.test(lower)) return 'Claude Opus (Thinking)';

  // Open-weights / GPT-OSS 120B
  if (/gpt-oss.*120b/i.test(lower)) return 'GPT-OSS 120B (Medium)';

  return trimmed.slice(0, 256);
}

export function modelContextCapacity(model) {
  if (typeof model !== 'string') return null;
  const name = model.toLowerCase();
  if (/gemini.*3\.8.*flash|model_placeholder_m31|gemini/i.test(name)) {
    return 1048576; // Gemini 3.8 Flash is 1M native context
  }
  if (/claude/i.test(name)) {
    return /5\.5/i.test(name) ? 1048576 : 200000; // Claude 5.5 is 1M; Claude 4.6 is 200K
  }
  if (/gpt-oss/i.test(name)) return 131072;
  return null;
}

export function modelCompressionLimit(model) {
  if (typeof model !== 'string') return null;
  const lower = model.toLowerCase();
  if (/m318|m319|m320|gemini.*3\.8.*flash|gemini/i.test(lower)) return 256000;
  if (/m400|m401|m402|m403|m404|m405|claude.*(?:5\.5|5-5)/i.test(lower)) return 256000;
  if (/m35|m26|claude.*(?:4\.6|4-6)/i.test(lower)) return 160000;
  if (/gpt-oss.*120b/i.test(lower)) return 80000;
  if (/claude/i.test(lower)) return 160000;
  return null;
}

export function contextMetrics(metadata, { model = null, sampledAt = null } = {}) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const usedTokens = count(metadata.estimatedTokensUsed), rawMax = count(metadata.maxContextTokens);
  if (usedTokens === null) return null;
  const known = modelContextCapacity(model);
  const maxTokens = known || (rawMax > 0 ? rawMax : null);
  const compressionLimit = modelCompressionLimit(model) || (rawMax > 0 ? rawMax : null);
  const compressionFraction = compressionLimit ? usedTokens / compressionLimit : null;
  const displayModel = formatModelName(model) || (typeof model === 'string' ? model.slice(0, 256) : null);

  return {
    usedTokens, maxTokens, remainingTokens: maxTokens === null ? null : Math.max(0, maxTokens - usedTokens),
    usedFraction: maxTokens === null ? null : usedTokens / maxTokens,
    remainingFraction: maxTokens === null ? null : Math.max(0, 1 - usedTokens / maxTokens),
    compressionLimit,
    compressionFraction,
    model: displayModel,
    sampledAt: typeof sampledAt === 'string' && Number.isFinite(Date.parse(sampledAt)) ? new Date(sampledAt).toISOString() : null,
    source: 'Antigravity context window metadata', estimated: true,
  };
}

export function safeContext(value) {
  if (!value) return null;
  const base = contextMetrics({ estimatedTokensUsed: value.usedTokens, maxContextTokens: value.maxTokens }, value);
  if (!base) return null;
  if (value.compressionLimit !== undefined) base.compressionLimit = value.compressionLimit;
  if (value.compressionFraction !== undefined) base.compressionFraction = value.compressionFraction;
  return base;
}
