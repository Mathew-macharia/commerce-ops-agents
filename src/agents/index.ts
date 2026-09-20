import type { Agent, AgentOutput, Job, ToolHost } from "../types.js";

function usesFacts(text: string, facts: string): boolean {
  return facts
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3)
    .some((w) => text.toLowerCase().includes(w));
}

export const catalogAgent: Agent = {
  id: "catalog-copy",
  name: "Catalog copy",
  kinds: ["catalog"],
  costTokens: 420,
  run(job: Job, tools: ToolHost): AgentOutput {
    const sku = tools.call({ tool: "read_sku", input: { sku: job.sku } });
    const name = String(sku.data.name);
    const facts = String(sku.data.facts);
    const title = name;
    const body = `${name} — ${facts}. Produced to order. Free digital proof before we print.`;
    const publish = tools.call({
      tool: "publish_listing",
      input: { sku: job.sku, title, body },
    });
    return {
      summary: `Published ${job.sku} as "${title}"`,
      toolCalls: [
        { tool: "read_sku", input: { sku: job.sku } },
        { tool: "publish_listing", input: { sku: job.sku, title } },
      ],
      artifact: { title, body, published: publish.data.published, usedFacts: usesFacts(body, facts) },
    };
  },
};

export const proofAgent: Agent = {
  id: "proof-qa",
  name: "Proof QA",
  kinds: ["proof"],
  costTokens: 180,
  run(job: Job, tools: ToolHost): AgentOutput {
    const art = tools.call({ tool: "inspect_artwork", input: { sku: job.sku } });
    const dpi = Number(art.data.dpi);
    const bleedMm = Number(art.data.bleedMm);
    const colors = (art.data.colors as string[]) ?? [];
    const issues: string[] = [];
    if (dpi < 300) issues.push(`dpi ${dpi} < 300`);
    if (bleedMm < 3) issues.push(`bleed ${bleedMm}mm < 3mm`);
    if (colors.includes("RGB")) issues.push("RGB artwork; convert to CMYK");
    if (colors.includes("spot")) issues.push("spot color needs press confirmation");
    const decision = issues.length === 0 ? "approve" : "hold";
    return {
      summary: `${decision.toUpperCase()} ${job.sku}: ${issues.length ? issues.join("; ") : "print-ready"}`,
      toolCalls: [{ tool: "inspect_artwork", input: { sku: job.sku } }],
      artifact: { decision, issues },
    };
  },
};

export const supportAgent: Agent = {
  id: "support-triage",
  name: "Support triage",
  kinds: ["support"],
  costTokens: 260,
  run(job: Job, tools: ToolHost): AgentOutput {
    const ticket = tools.call({ tool: "list_open_tickets", input: { sku: job.sku } });
    const tone = String(ticket.data.tone);
    const replies: Record<string, string> = {
      refund_or_reprint:
        "Sorry the stickers arrived in the wrong shape. We will reprint at no charge and email a new proof today.",
      tracking:
        "Tracking is stalled. I escalated to the carrier and will send an updated ETA within 4 hours.",
      rush: "24-hour mesh banners are available. If you approve the proof before 2pm we can ship overnight.",
    };
    const reply = replies[tone] ?? "Thanks for writing — a specialist will follow up with next steps.";
    tools.call({ tool: "draft_reply", input: { reply } });
    return {
      summary: `Queued ${tone} reply for ${job.sku}`,
      toolCalls: [
        { tool: "list_open_tickets", input: { sku: job.sku } },
        { tool: "draft_reply", input: { reply } },
      ],
      artifact: { tone, reply, mentionedSku: reply.length > 40 },
    };
  },
};

/** Keyword-stuffed copy that ignores product facts. Eval should disable it. */
export const legacyCopyAgent: Agent = {
  id: "legacy-blurb",
  name: "Legacy blurb (underperformer)",
  kinds: ["catalog"],
  costTokens: 90,
  run(job: Job): AgentOutput {
    const forbidden = (job.payload.forbidden as string[]) ?? [];
    const body = "Cheap stickers. Best in the world. Buy now!!!";
    return {
      summary: `Blurbed ${job.sku} with filler copy`,
      toolCalls: [],
      artifact: { title: "STICKERS", body, usedForbidden: forbidden.some((w) => body.toLowerCase().includes(w)) },
    };
  },
};
