import { catalogAgent, legacyCopyAgent, proofAgent, supportAgent } from "./agents/index.js";
import { shiftJobs } from "./data/jobs.js";
import { EvalStore } from "./eval/store.js";
import { Orchestrator } from "./orchestrator.js";

function printScoreboard(store: EvalStore): void {
  const rows = store.scoreboard().sort((a, b) => b.score - a.score);
  console.log("\nAgent scoreboard");
  console.log("  id                   jobs  win%   score  status");
  for (const row of rows) {
    const win = `${Math.round(row.successRate * 100)}%`.padStart(4);
    const score = row.score.toFixed(2);
    const status = row.disabled ? "disabled" : "live";
    console.log(`  ${row.agentId.padEnd(20)} ${String(row.jobs).padStart(4)}  ${win}   ${score}  ${status}`);
  }
}

function main(): void {
  const store = new EvalStore();
  const crew = new Orchestrator(
    [legacyCopyAgent, catalogAgent, proofAgent, supportAgent],
    store,
  );

  console.log("Shift 1 — A/B every matching agent, including the weak copy agent\n");
  crew.runShift(shiftJobs, "shift-1", true);
  printScoreboard(store);

  console.log("\nShift 2 — same queue; keep the winner, skip disabled agents\n");
  const second = crew.runShift(shiftJobs, "shift-2");
  if (second.skipped.length) {
    console.log("\nSkipped (agent already killed):");
    for (const s of second.skipped) {
      console.log(`  ${s.jobId}  would have used ${s.agentId}`);
    }
  }
  printScoreboard(store);

  const killed = store.scoreboard().filter((s) => s.disabled).map((s) => s.agentId);
  if (!killed.includes("legacy-blurb")) {
    throw new Error("expected legacy-blurb to be disabled after failing catalog jobs");
  }
  console.log("\nKill switch fired on:", killed.join(", "));
  console.log("Demo complete.");
}

main();
