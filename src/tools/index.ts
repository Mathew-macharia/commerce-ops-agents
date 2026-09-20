import type { Job, ToolCall, ToolHost, ToolResult } from "../types.js";

const SKUS: Record<string, { name: string; facts: string }> = {
  "STK-ROUND-50": { name: "Die-cut round sticker", facts: "2 inch outdoor vinyl, 50 pack" },
  "LBL-CLEAR-100": { name: "Clear product label", facts: "3x2 waterproof roll of 100" },
  "BAN-MESH-3X6": { name: "Mesh vinyl banner", facts: "3x6 ft hemmed with grommets" },
};

export function createTools(job: Job): ToolHost {
  return {
    call(call: ToolCall): ToolResult {
      switch (call.tool) {
        case "read_sku":
          return { ok: true, data: SKUS[job.sku] ?? { name: job.sku, facts: "" } };
        case "inspect_artwork":
          return {
            ok: true,
            data: {
              dpi: Number(job.payload.dpi ?? 0),
              bleedMm: Number(job.payload.bleedMm ?? 0),
              colors: job.payload.colors ?? [],
              printReady: Number(job.payload.dpi) >= 300 && Number(job.payload.bleedMm) >= 3,
            },
          };
        case "list_open_tickets":
          return {
            ok: true,
            data: {
              sku: job.sku,
              message: String(job.payload.message ?? ""),
              tone: String(job.payload.tone ?? "general"),
            },
          };
        case "publish_listing":
          return {
            ok: true,
            data: { published: true, sku: job.sku, title: String(call.input.title ?? "") },
          };
        case "draft_reply":
          return {
            ok: true,
            data: { queued: true, reply: String(call.input.reply ?? "") },
          };
        default:
          return { ok: false, data: { error: "unknown_tool" } };
      }
    },
  };
}
