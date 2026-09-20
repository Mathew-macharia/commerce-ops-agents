import type { Agent, Job, RunRecord } from "./types.js";
import { EvalStore } from "./eval/store.js";
import { createTools } from "./tools/index.js";

export type ShiftResult = {
  records: RunRecord[];
  skipped: { jobId: string; agentId: string }[];
};

function validate(job: Job, agent: Agent, artifact: Record<string, unknown> | undefined): { ok: boolean; reason: string } {
  if (agent.id === "legacy-blurb") {
    return { ok: false, reason: "filler copy / banned claims" };
  }
  if (job.kind === "catalog") {
    if (!artifact?.published || !artifact?.usedFacts) {
      return { ok: false, reason: "listing missing facts or publish" };
    }
    return { ok: true, reason: "listing published with product facts" };
  }
  if (job.kind === "proof") {
    const issues = (artifact?.issues as string[]) ?? [];
    const decision = artifact?.decision;
    const shouldHold = issues.length > 0;
    const ok = shouldHold ? decision === "hold" : decision === "approve";
    return { ok, reason: ok ? `proof ${decision}` : "wrong proof decision" };
  }
  if (job.kind === "support") {
    const ok = Boolean(artifact?.mentionedSku) && String(artifact?.reply ?? "").length > 20;
    return { ok, reason: ok ? "actionable reply queued" : "empty or generic reply" };
  }
  return { ok: false, reason: "unknown job kind" };
}

export class Orchestrator {
  constructor(
    private readonly agents: Agent[],
    readonly evalStore: EvalStore,
  ) {}

  runShift(jobs: Job[], label: string, evaluateAll = false): ShiftResult {
    const records: RunRecord[] = [];
    const skipped: ShiftResult["skipped"] = [];

    for (const job of jobs) {
      const candidates = evaluateAll ? this.eligible(job) : this.pick(job);
      if (candidates.length === 0) continue;

      for (const agent of candidates) {
        if (this.evalStore.isDisabled(agent.id)) {
          skipped.push({ jobId: job.id, agentId: agent.id });
          continue;
        }
        records.push(this.execute(job, agent, label));
      }
    }

    return { records, skipped };
  }

  private execute(job: Job, agent: Agent, label: string): RunRecord {
    const started = Date.now();
    const tools = createTools(job);
    const output = agent.run(job, tools);
    const latencyMs = Math.max(8, Date.now() - started + jitter(agent.costTokens));
    const { ok, reason } = validate(job, agent, output.artifact);
    const record = this.evalStore.record({
      jobId: job.id,
      agentId: agent.id,
      ok,
      reason,
      latencyMs,
      costTokens: agent.costTokens,
    });
    const flag = record.disabledAfter ? "  [DISABLED]" : "";
    const mark = ok ? "ok" : "FAIL";
    console.log(`  [${label}] ${job.id} → ${agent.id}  ${mark}  ${reason}${flag}`);
    return record;
  }

  private eligible(job: Job): Agent[] {
    return this.agents.filter((a) => a.kinds.includes(job.kind));
  }

  private pick(job: Job): Agent[] {
    const live = this.eligible(job).filter((a) => !this.evalStore.isDisabled(a.id));
    if (live.length === 0) return [];
    const scores = this.evalStore.scoreboard();
    live.sort((a, b) => scoreOf(scores, b.id) - scoreOf(scores, a.id) || a.id.localeCompare(b.id));
    return [live[0]];
  }
}

function scoreOf(scores: { agentId: string; score: number }[], id: string): number {
  return scores.find((s) => s.agentId === id)?.score ?? 0;
}

function jitter(costTokens: number): number {
  return Math.round(costTokens / 40);
}
