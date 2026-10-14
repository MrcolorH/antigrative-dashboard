import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { contextMetrics, modelContextCapacity, modelCompressionLimit, formatModelName, parseTranscriptContent, estimateTokensFromText } from "../context.mjs";
import { trajectoryMetrics } from "../metrics.mjs";
import { SessionHistory, safeMetrics } from "../history.mjs";
import { MetricsStore } from "../store.mjs";

const id = "11111111-1111-1111-1111-111111111111",
  scope = "a".repeat(64);
const raw = (used, max = 256000, n = 1) => ({
  trajectory: {
    cascadeId: id,
    generatorMetadata: Array.from({ length: n }, (_, i) => ({
      chatModel: {
        modelDisplayName: "Model A",
        usage: {
          messageId: String(i),
          inputTokens: "100",
          responseOutputTokens: "100",
          apiProvider: "API_PROVIDER_GOOGLE_GEMINI",
        },
        streamingDuration: "2s",
        chatStartMetadata: {
          contextWindowMetadata: {
            estimatedTokensUsed: used,
            maxContextTokens: max,
            tokenBreakdown: { prompt: "DO NOT SAVE" },
          },
        },
      },
    })),
  },
});

test("context is latest request estimate, never accumulated tokens; 0 and over-capacity remain honest", () => {
  const result = trajectoryMetrics(raw(112000, 256000, 3));
  assert.equal(result.context.usedTokens, 112000);
  assert.equal(result.context.usedFraction, 0.4375);
  assert.equal(result.context.remainingTokens, 144000);
  assert.equal(
    contextMetrics({ estimatedTokensUsed: 0, maxContextTokens: 100 })
      .usedFraction,
    0,
  );
  const over = contextMetrics({
    estimatedTokensUsed: 120,
    maxContextTokens: 100,
  });
  assert.equal(over.usedFraction, 1.2);
  assert.equal(over.remainingTokens, 0);
});
test("missing, invalid and unsafe counters cannot produce invented capacities or percentages", () => {
  for (const estimatedTokensUsed of [
    -1,
    Infinity,
    "wrong",
    true,
    {},
    Number.MAX_SAFE_INTEGER + 1,
  ])
    assert.equal(
      contextMetrics({ estimatedTokensUsed, maxContextTokens: 100 }),
      null,
    );
  assert.equal(contextMetrics({ maxContextTokens: 100 }), null);
  for (const maxContextTokens of [undefined, 0, -1, Infinity, "", true]) {
    const value = contextMetrics({ estimatedTokensUsed: 20, maxContextTokens });
    assert.equal(value.usedTokens, 20);
    assert.equal(value.maxTokens, null);
    assert.equal(value.usedFraction, null);
  }
});
test("latest model with absent context cannot inherit prior-model capacity", () => {
  const first = raw(40, 100).trajectory.generatorMetadata[0];
  const data = trajectoryMetrics({
    trajectory: {
      generatorMetadata: [
        first,
        { chatModel: { modelDisplayName: "Model B" } },
      ],
    },
  });
  assert.equal(data.context, null);
});
test("only numeric context and sampled model/time enter history; lower usage survives compaction and restart", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "ag-context-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const history = new SessionHistory(directory);
  await history.save(scope, id, trajectoryMetrics(raw(80000, 100000, 3)));
  await history.save(scope, id, trajectoryMetrics(raw(20000, 100000, 1)));
  const restored = await new SessionHistory(directory).load(scope, id);
  assert.equal(restored.metrics.context.usedTokens, 20000);
  assert.equal(restored.metrics.requests, 3);
  const text = await readFile(history.file(scope, id), "utf8");
  assert.ok(!text.includes("DO NOT SAVE"));
  assert.ok(!text.includes("tokenBreakdown"));
  const clean = safeMetrics(
    {
      ...trajectoryMetrics(raw(20, 100)),
      context: {
        usedTokens: 20,
        maxTokens: 100,
        usedFraction: 999,
        credential: "secret",
      },
    },
    id,
  );
  assert.equal(clean.context.usedFraction, 0.2);
  assert.ok(!JSON.stringify(clean).includes("secret"));
});
test("context-only records can persist while old v0.4 records without context still load", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "ag-context-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const history = new SessionHistory(directory);
  const data = trajectoryMetrics({
    trajectory: {
      generatorMetadata: [
        {
          chatModel: {
            chatStartMetadata: {
              contextWindowMetadata: {
                estimatedTokensUsed: 0,
                maxContextTokens: 100,
              },
            },
          },
        },
      ],
    },
  });
  await history.save(scope, id, data);
  assert.equal((await history.load(scope, id)).metrics.context.usedFraction, 0);
  const old = trajectoryMetrics(raw(20));
  delete old.context;
  await history.save(scope, id, old);
  assert.equal((await history.load(scope, id)).metrics.tps, 50);
});
test("live lower context updates even when cumulative TPS history is protected", async () => {
  let n = 3,
    used = 80;
  const history = {
    load: async () => null,
    save: async () => ({ savedAt: "2026-10-09T00:00:00Z" }),
  };
  const store = new MetricsStore(
    { trajectory: async () => raw(used, 100, n) },
    { history },
  );
  store.identity = scope;
  await store.session(id, true);
  n = 1;
  used = 20;
  const current = await store.session(id, true);
  assert.equal(current.requests, 3);
  assert.equal(current.context.usedFraction, 0.2);
  assert.equal(current.contextRestored, false);
});
test("known models resolve canonical capacity over host fallback ceiling (e.g. Gemini 1M)", () => {
  assert.equal(modelContextCapacity("gemini-3.8-flash-n"), 1048576);
  assert.equal(modelContextCapacity("Gemini 3.8 Flash (High)"), 1048576);
  assert.equal(modelContextCapacity("claude-sonnet-5.5"), 1048576);
  assert.equal(modelContextCapacity("claude-sonnet-4-6"), 200000);
  assert.equal(modelContextCapacity("gpt-oss-120b"), 131072);
  assert.equal(modelContextCapacity("Model A"), null);
  assert.equal(modelContextCapacity(null), null);
  assert.equal(modelContextCapacity(123), null);

  assert.equal(formatModelName("gemini-3.8-flash-n"), "Gemini 3.8 Flash");
  assert.equal(formatModelName("MODEL_PLACEHOLDER_M318"), "Gemini 3.8 Flash (High)");
  assert.equal(formatModelName("MODEL_PLACEHOLDER_M319"), "Gemini 3.8 Flash (Medium)");
  assert.equal(formatModelName("claude-sonnet-5.5"), "Claude Sonnet 5.5 (Thinking)");
  assert.equal(formatModelName("claude-opus-5.5"), "Claude Opus 5.5 (Thinking)");
  assert.equal(formatModelName("claude-sonnet-4-6"), "Claude Sonnet 4.6 (Thinking)");
  assert.equal(formatModelName("claude-opus-4-6"), "Claude Opus 4.6 (Thinking)");
  assert.equal(formatModelName("gpt-oss-120b"), "GPT-OSS 120B (Medium)");
  assert.equal(formatModelName("Model A"), "Model A");

  const metrics = contextMetrics(
    { estimatedTokensUsed: 211700, maxContextTokens: 256000 },
    { model: "gemini-3.8-flash-n" },
  );
  assert.equal(metrics.maxTokens, 1048576);
  assert.equal(metrics.usedTokens, 211700);
  assert.equal(metrics.remainingTokens, 1048576 - 211700);
  assert.equal(metrics.model, "Gemini 3.8 Flash");
  assert.equal(Math.round(metrics.usedFraction * 100), 20);
  assert.equal(Math.round(metrics.remainingFraction * 100), 80);

  const fallback = contextMetrics(
    { estimatedTokensUsed: 211700, maxContextTokens: 256000 },
    { model: "custom-model" },
  );
  assert.equal(fallback.maxTokens, 256000);
  assert.equal(fallback.model, "custom-model");
  assert.equal(Math.round(fallback.usedFraction * 100), 83);
});

test("parseTranscriptContent calculates session tokens with multilingual heuristic, compaction and image steps", () => {
  assert.equal(estimateTokensFromText("Hello world"), 3);
  assert.equal(estimateTokensFromText("你好世界"), 3); // 4 CJK chars / 1.5 = 2.66 -> ceil = 3
  assert.equal(estimateTokensFromText(""), 0);

  assert.equal(modelCompressionLimit("gemini-3.8-flash-n"), 256000);
  assert.equal(modelCompressionLimit("MODEL_PLACEHOLDER_M318"), 256000);
  assert.equal(modelCompressionLimit("claude-sonnet-5.5"), 256000);
  assert.equal(modelCompressionLimit("claude-sonnet-4-6"), 160000);
  assert.equal(modelCompressionLimit("gpt-oss-120b"), 80000);

  const jsonl = [
    JSON.stringify({ type: "USER_INPUT", content: "Hello world" }),
    JSON.stringify({ type: "PLANNER_RESPONSE", content: "Hi there!", thinking: "thinking..." }),
    JSON.stringify({ type: "GENERIC", content: "command output 1234567890" }),
    JSON.stringify({ type: "CHECKPOINT", content: "checkpoint context" }),
    JSON.stringify({ type: "CHECKPOINT", content: "# Resuming from a compaction" }),
    JSON.stringify({ type: "IMAGE_GENERATION", model: "nano-banana-image", content: "generated image" }),
  ].join("\n");
  const stats = parseTranscriptContent(jsonl);
  assert.equal(stats.steps, 6);
  assert.equal(stats.userTok, 3);
  assert.ok(stats.agentTok > 0);
  assert.ok(stats.toolTok > 0);
  assert.ok(stats.systemTok > 0);
  assert.equal(stats.totalUsed, stats.userTok + stats.agentTok + stats.toolTok + stats.systemTok);
  assert.equal(stats.compactionCount, 1);
  assert.equal(stats.compressionDetected, true);
  assert.equal(stats.imageGenStepCount, 1);

  const enriched = contextMetrics(
    { estimatedTokensUsed: 50, maxContextTokens: 256000 },
    { model: "gemini-3.8-flash-n", transcriptStats: stats },
  );
  assert.equal(enriched.usedTokens, stats.totalUsed);
  assert.equal(enriched.maxTokens, 1048576);
  assert.equal(enriched.compressionLimit, 256000);
  assert.equal(enriched.compressionDetected, true);
  assert.equal(enriched.compactionCount, 1);
  assert.equal(enriched.imageGenStepCount, 1);
  assert.equal(enriched.promptTokens, 50);
  assert.equal(enriched.source, "Antigravity session transcript");
  assert.equal(enriched.breakdown.userTokens, stats.userTok);
  assert.equal(enriched.transcriptSteps, 6);

  const cleaned = safeMetrics({
    counts: {},
    cache: {},
    context: enriched,
  }, id);
  assert.equal(cleaned.context.compressionLimit, 256000);
  assert.equal(cleaned.context.compressionDetected, true);
  assert.equal(cleaned.context.compactionCount, 1);
  assert.equal(cleaned.context.imageGenStepCount, 1);

  // Undo / Rewind test: capping at 3 steps rolls back context usage and steps
  const rolledBackStats = parseTranscriptContent(jsonl, 3);
  assert.equal(rolledBackStats.steps, 3);
  assert.ok(rolledBackStats.totalUsed < stats.totalUsed);
  assert.equal(rolledBackStats.compactionCount, 0); // compaction in step 5 is not reached
  assert.equal(rolledBackStats.compressionDetected, false);
  assert.equal(rolledBackStats.imageGenStepCount, 0); // image gen in step 6 is not reached
});
