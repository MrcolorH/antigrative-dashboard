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

export function estimateTokensFromText(text) {
  if (!text || typeof text !== 'string') return 0;
  let asciiChars = 0;
  let nonAsciiChars = 0;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) < 128) {
      asciiChars++;
    } else {
      nonAsciiChars++;
    }
  }
  return Math.ceil(asciiChars / 4 + nonAsciiChars / 1.5);
}

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const transcriptCache = new Map();

export function findTranscriptPath(convId) {
  if (!convId || typeof convId !== 'string') return null;
  const candidates = [];
  const basePatterns = [
    path.join(os.homedir(), '.gemini/antigravity*/brain', convId, '.system_generated/logs/transcript_full.jsonl'),
    path.join(os.homedir(), '.gemini/antigravity*/brain', convId, '.system_generated/logs/transcript.jsonl')
  ];
  for (const pattern of basePatterns) {
    try {
      if (typeof fs.globSync === 'function') {
        candidates.push(...fs.globSync(pattern));
      }
    } catch {}
  }
  if (!candidates.length) return null;
  const full = candidates.find(c => c.endsWith('transcript_full.jsonl'));
  if (full) return full;
  return candidates.sort((a, b) => {
    try {
      return fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs;
    } catch { return 0; }
  })[0];
}

export function parseTranscriptContent(content, maxSteps = null) {
  if (typeof content !== 'string' || !content.trim()) return null;
  const lines = content.split('\n');
  let userTok = 0, agentTok = 0, toolTok = 0, systemTok = 0, steps = 0;
  let compactionCount = 0;
  let imageGenStepCount = 0;
  let prevCheckpointInputTokens = -1;
  let compressionDetected = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (typeof maxSteps === 'number' && maxSteps > 0 && steps >= maxSteps) {
      break;
    }
    try {
      const step = JSON.parse(trimmed);
      steps++;
      const stype = String(step.type || '');
      const src = String(step.source || '');
      const c = typeof step.content === 'string' ? step.content : (step.content ? JSON.stringify(step.content) : '');
      const thinking = typeof step.thinking === 'string' ? step.thinking : '';
      const toolCalls = step.tool_calls ? JSON.stringify(step.tool_calls) : '';

      // Image generation step detection: keywords in type or generatorModel
      const stepModel = String(step.metadata?.generatorModel || step.model || '');
      if (/image|generate/i.test(stype) || /nano|banana|image/i.test(stepModel)) {
        imageGenStepCount++;
      }

      // Checkpoint and compaction detection
      if (c.includes('# Resuming from a compaction') || c.includes('<CONTEXT_SUMMARY>') || c.includes('Resuming from a compaction')) {
        compactionCount++;
        compressionDetected = true;
      }

      if (stype === 'CHECKPOINT' || stype.includes('CHECKPOINT')) {
        const mu = step.metadata?.modelUsage;
        if (mu) {
          const inputTokens = parseInt(String(mu.inputTokens || '0'), 10);
          if (prevCheckpointInputTokens > 0 && inputTokens < prevCheckpointInputTokens) {
            const drop = prevCheckpointInputTokens - inputTokens;
            if (drop > 5000) {
              compactionCount++;
              compressionDetected = true;
            }
          }
          if (inputTokens > 0) prevCheckpointInputTokens = inputTokens;
        }
      }

      const cTokens = estimateTokensFromText(c);
      const tTokens = estimateTokensFromText(thinking) + estimateTokensFromText(toolCalls);

      if (stype === 'USER_INPUT') userTok += cTokens;
      else if (stype === 'GENERIC') toolTok += cTokens;
      else if (stype === 'PLANNER_RESPONSE') agentTok += cTokens + tTokens;
      else if (stype === 'CHECKPOINT' || stype === 'SYSTEM_MESSAGE' || src === 'SYSTEM') systemTok += cTokens;
      else agentTok += cTokens + tTokens;
    } catch {}
  }
  const totalUsed = userTok + agentTok + toolTok + systemTok;
  return { steps, userTok, agentTok, toolTok, systemTok, totalUsed, compactionCount, compressionDetected, imageGenStepCount };
}

export function readTranscriptStats(convId, maxSteps = null) {
  const filePath = findTranscriptPath(convId);
  if (!filePath) return null;
  try {
    const stat = fs.statSync(filePath);
    const key = `${convId}:${typeof maxSteps === 'number' && maxSteps > 0 ? maxSteps : 'all'}`;
    const cached = transcriptCache.get(key);
    if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
      return cached.stats;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = parseTranscriptContent(content, maxSteps);
    if (stats) {
      transcriptCache.set(key, { mtimeMs: stat.mtimeMs, size: stat.size, stats });
    }
    return stats;
  } catch {
    return null;
  }
}

export function contextMetrics(metadata, { model = null, sampledAt = null, transcriptStats = null } = {}) {
  const meta = (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) ? metadata : {};
  const promptTokens = count(meta.estimatedTokensUsed);
  const usedTokens = transcriptStats?.totalUsed !== undefined ? count(transcriptStats.totalUsed) : promptTokens;
  if (usedTokens === null) return null;
  const rawMax = count(meta.maxContextTokens);
  const known = modelContextCapacity(model);
  const maxTokens = known || (rawMax > 0 ? rawMax : null) || (transcriptStats ? 1048576 : null);
  const compressionLimit = modelCompressionLimit(model) || (rawMax > 0 ? rawMax : null);
  const compressionFraction = compressionLimit ? usedTokens / compressionLimit : null;
  const displayModel = formatModelName(model) || (typeof model === 'string' ? model.slice(0, 256) : null);
  const compressionDetected = Boolean(transcriptStats?.compressionDetected || (transcriptStats?.compactionCount && transcriptStats.compactionCount > 0));
  const compactionCount = transcriptStats?.compactionCount || 0;
  const imageGenStepCount = transcriptStats?.imageGenStepCount || 0;

  return {
    usedTokens, maxTokens, remainingTokens: maxTokens === null ? null : Math.max(0, maxTokens - usedTokens),
    usedFraction: maxTokens === null ? null : usedTokens / maxTokens,
    remainingFraction: maxTokens === null ? null : Math.max(0, 1 - usedTokens / maxTokens),
    compressionLimit,
    compressionFraction,
    compressionDetected,
    compactionCount,
    imageGenStepCount,
    model: displayModel,
    sampledAt: typeof sampledAt === 'string' && Number.isFinite(Date.parse(sampledAt)) ? new Date(sampledAt).toISOString() : null,
    source: transcriptStats ? 'Antigravity session transcript' : 'Antigravity context window metadata',
    estimated: true,
    ...(promptTokens !== null ? { promptTokens } : {}),
    ...(transcriptStats ? {
      breakdown: {
        userTokens: transcriptStats.userTok,
        agentTokens: transcriptStats.agentTok,
        toolTokens: transcriptStats.toolTok,
        systemTokens: transcriptStats.systemTok,
      },
      transcriptSteps: transcriptStats.steps,
    } : {}),
  };
}

export function safeContext(value) {
  if (!value) return null;
  const base = contextMetrics({ estimatedTokensUsed: value.promptTokens ?? value.usedTokens, maxContextTokens: value.maxTokens }, value);
  if (!base) return null;
  if (value.breakdown) base.breakdown = value.breakdown;
  if (value.transcriptSteps) base.transcriptSteps = value.transcriptSteps;
  if (value.source) base.source = value.source;
  if (value.compressionLimit !== undefined) base.compressionLimit = value.compressionLimit;
  if (value.compressionFraction !== undefined) base.compressionFraction = value.compressionFraction;
  if (value.compressionDetected !== undefined) base.compressionDetected = Boolean(value.compressionDetected);
  if (value.compactionCount !== undefined) base.compactionCount = Number(value.compactionCount) || 0;
  if (value.imageGenStepCount !== undefined) base.imageGenStepCount = Number(value.imageGenStepCount) || 0;
  if (value.usedTokens) {
    base.usedTokens = value.usedTokens;
    if (base.maxTokens) {
      base.remainingTokens = Math.max(0, base.maxTokens - base.usedTokens);
      base.usedFraction = base.usedTokens / base.maxTokens;
      base.remainingFraction = Math.max(0, 1 - base.usedTokens / base.maxTokens);
    }
    if (base.compressionLimit) {
      base.compressionFraction = base.usedTokens / base.compressionLimit;
    }
  }
  return base;
}
