import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { contextMetrics, formatModelName, modelContextCapacity, modelCompressionLimit } from '../context.mjs';
import { trajectoryMetrics } from '../metrics.mjs';
import { SessionHistory, safeMetrics } from '../history.mjs';
import { MetricsStore } from '../store.mjs';

const id='11111111-1111-1111-1111-111111111111',scope='a'.repeat(64);
const raw=(used,max=256000,n=1)=>({trajectory:{cascadeId:id,generatorMetadata:Array.from({length:n},(_,i)=>({chatModel:{modelDisplayName:'Model A',usage:{messageId:String(i),inputTokens:'100',responseOutputTokens:'100',apiProvider:'API_PROVIDER_GOOGLE_GEMINI'},streamingDuration:'2s',chatStartMetadata:{contextWindowMetadata:{estimatedTokensUsed:used,maxContextTokens:max,tokenBreakdown:{prompt:'DO NOT SAVE'}}}}}))}});

test('context is latest request estimate, never accumulated tokens; 0 and over-capacity remain honest',()=>{
  const result=trajectoryMetrics(raw(112000,256000,3));
  assert.equal(result.context.usedTokens,112000);assert.equal(result.context.usedFraction,.4375);
  assert.equal(result.context.remainingTokens,144000);
  assert.equal(contextMetrics({estimatedTokensUsed:0,maxContextTokens:100}).usedFraction,0);
  const over=contextMetrics({estimatedTokensUsed:120,maxContextTokens:100});
  assert.equal(over.usedFraction,1.2);assert.equal(over.remainingTokens,0);
});
test('missing, invalid and unsafe counters cannot produce invented capacities or percentages',()=>{
  for(const estimatedTokensUsed of [-1,Infinity,'wrong',true,{},Number.MAX_SAFE_INTEGER+1])assert.equal(contextMetrics({estimatedTokensUsed,maxContextTokens:100}),null);
  assert.equal(contextMetrics({maxContextTokens:100}),null);
  for(const maxContextTokens of [undefined,0,-1,Infinity,'',true]){
    const value=contextMetrics({estimatedTokensUsed:20,maxContextTokens});
    assert.equal(value.usedTokens,20);assert.equal(value.maxTokens,null);assert.equal(value.usedFraction,null);
  }
});
test('latest model with absent context cannot inherit prior-model capacity',()=>{
  const first=raw(40,100).trajectory.generatorMetadata[0];
  const data=trajectoryMetrics({trajectory:{generatorMetadata:[first,{chatModel:{modelDisplayName:'Model B'}}]}});
  assert.equal(data.context,null);
});
test('only numeric context and sampled model/time enter history; lower usage survives compaction and restart',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'ag-context-'));t.after(()=>rm(directory,{recursive:true,force:true}));
  const history=new SessionHistory(directory);
  await history.save(scope,id,trajectoryMetrics(raw(80000,100000,3)));
  await history.save(scope,id,trajectoryMetrics(raw(20000,100000,1)));
  const restored=await new SessionHistory(directory).load(scope,id);
  assert.equal(restored.metrics.context.usedTokens,20000);assert.equal(restored.metrics.requests,3);
  const text=await readFile(history.file(scope,id),'utf8');assert.ok(!text.includes('DO NOT SAVE'));assert.ok(!text.includes('tokenBreakdown'));
  const clean=safeMetrics({...trajectoryMetrics(raw(20,100)),context:{usedTokens:20,maxTokens:100,usedFraction:999,credential:'secret'}},id);
  assert.equal(clean.context.usedFraction,.2);assert.ok(!JSON.stringify(clean).includes('secret'));
});
test('context-only records can persist while old v0.4 records without context still load',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'ag-context-'));t.after(()=>rm(directory,{recursive:true,force:true}));
  const history=new SessionHistory(directory);
  const data=trajectoryMetrics({trajectory:{generatorMetadata:[{chatModel:{chatStartMetadata:{contextWindowMetadata:{estimatedTokensUsed:0,maxContextTokens:100}}}}]}});
  await history.save(scope,id,data);assert.equal((await history.load(scope,id)).metrics.context.usedFraction,0);
  const old=trajectoryMetrics(raw(20));delete old.context;await history.save(scope,id,old);
  assert.equal((await history.load(scope,id)).metrics.tps,50);
});
test('live lower context updates even when cumulative TPS history is protected',async()=>{
  let n=3,used=80;
  const history={load:async()=>null,save:async()=>({savedAt:'2026-10-09T00:00:00Z'})};
  const store=new MetricsStore({trajectory:async()=>raw(used,100,n)},{history});store.identity=scope;
  await store.session(id,true);n=1;used=20;
  const current=await store.session(id,true);
  assert.equal(current.requests,3);assert.equal(current.context.usedFraction,.2);assert.equal(current.contextRestored,false);
});

test('known models resolve canonical capacity over host fallback ceiling (e.g. Gemini 1M)', () => {
  assert.equal(modelContextCapacity('gemini-3.8-flash-n'), 1048576);
  assert.equal(modelContextCapacity('Gemini 3.8 Flash (High)'), 1048576);
  assert.equal(modelContextCapacity('Claude Sonnet 5.5 (Thinking)'), 1048576);
  assert.equal(modelContextCapacity('Claude Sonnet 4.6 (Thinking)'), 200000);
  assert.equal(modelContextCapacity('GPT-OSS 120B (Medium)'), 131072);
  assert.equal(modelContextCapacity('unknown-model'), null);

  assert.equal(modelCompressionLimit('gemini-3.8-flash-n'), 256000);
  assert.equal(modelCompressionLimit('MODEL_PLACEHOLDER_M318'), 256000);
  assert.equal(modelCompressionLimit('claude-sonnet-5.5'), 256000);
  assert.equal(modelCompressionLimit('claude-sonnet-4-6'), 160000);
  assert.equal(modelCompressionLimit('gpt-oss-120b'), 80000);

  assert.equal(formatModelName('gemini-3.8-flash-n'), 'Gemini 3.8 Flash');
  assert.equal(formatModelName('MODEL_PLACEHOLDER_M318'), 'Gemini 3.8 Flash (High)');
  assert.equal(formatModelName('MODEL_PLACEHOLDER_M319'), 'Gemini 3.8 Flash (Medium)');
  assert.equal(formatModelName('MODEL_PLACEHOLDER_M317'), 'Gemini 3.8 Flash (Low)');

  const result = contextMetrics(
    { estimatedTokensUsed: 128000, maxContextTokens: 256000 },
    { model: 'gemini-3.8-flash-n' }
  );
  assert.equal(result.usedTokens, 128000);
  assert.equal(result.maxTokens, 1048576); // 1M native capacity overrides 256K host ceiling
  assert.equal(result.compressionLimit, 256000);
  assert.equal(result.usedFraction, 128000 / 1048576);
  assert.equal(result.compressionFraction, 128000 / 256000);
  assert.equal(result.model, 'Gemini 3.8 Flash');
});
