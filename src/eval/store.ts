import type { AgentScore, RunRecord } from "../types.js";

const MIN_JOBS_BEFORE_KILL = 2;
const SUCCESS_FLOOR = 0.5;

export class EvalStore {
  readonly runs: RunRecord[] = [];
  private disabled = new Set<string>();

  record(run: RunRecord): RunRecord {
    const next = { ...run, disabledAfter: false };
    this.runs.push(next);
    if (this.shouldDisable(run.agentId)) {
      this.disabled.add(run.agentId);
      next.disabledAfter = true;
    }
    return next;
  }

  isDisabled(agentId: string): boolean {
    return this.disabled.has(agentId);
  }

  scoreboard(): AgentScore[] {
    const byAgent = new Map<string, RunRecord[]>();
    for (const run of this.runs) {
      const list = byAgent.get(run.agentId) ?? [];
      list.push(run);
      byAgent.set(run.agentId, list);
    }

    return [...byAgent.entries()].map(([agentId, runs]) => {
      const successes = runs.filter((r) => r.ok).length;
      const successRate = successes / runs.length;
      const avgLatencyMs = avg(runs.map((r) => r.latencyMs));
      const avgCost = avg(runs.map((r) => r.costTokens));
      const speed = clamp(1 - avgLatencyMs / 80, 0, 1);
      const cheap = clamp(1 - avgCost / 900, 0, 1);
      const score = successRate * 0.7 + cheap * 0.15 + speed * 0.15;
      return {
        agentId,
        jobs: runs.length,
        successes,
        successRate,
        avgLatencyMs,
        avgCost,
        score,
        disabled: this.disabled.has(agentId),
      };
    });
  }

  private shouldDisable(agentId: string): boolean {
    if (this.disabled.has(agentId)) return false;
    const mine = this.runs.filter((r) => r.agentId === agentId);
    if (mine.length < MIN_JOBS_BEFORE_KILL) return false;
    const rate = mine.filter((r) => r.ok).length / mine.length;
    return rate < SUCCESS_FLOOR;
  }
}

function avg(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
