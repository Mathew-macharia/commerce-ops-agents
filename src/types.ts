export type JobKind = "catalog" | "proof" | "support";

export type Job = {
  id: string;
  kind: JobKind;
  sku: string;
  payload: Record<string, unknown>;
};

export type ToolName =
  | "read_sku"
  | "inspect_artwork"
  | "list_open_tickets"
  | "publish_listing"
  | "draft_reply";

export type ToolCall = {
  tool: ToolName;
  input: Record<string, unknown>;
};

export type ToolResult = {
  ok: boolean;
  data: Record<string, unknown>;
};

export type AgentOutput = {
  summary: string;
  toolCalls: ToolCall[];
  artifact?: Record<string, unknown>;
};

export type RunRecord = {
  jobId: string;
  agentId: string;
  ok: boolean;
  reason: string;
  latencyMs: number;
  costTokens: number;
  disabledAfter?: boolean;
};

export type AgentScore = {
  agentId: string;
  jobs: number;
  successes: number;
  successRate: number;
  avgLatencyMs: number;
  avgCost: number;
  score: number;
  disabled: boolean;
};

export interface Agent {
  id: string;
  name: string;
  kinds: JobKind[];
  /** Baseline token cost claimed per job. */
  costTokens: number;
  run(job: Job, tools: ToolHost): AgentOutput;
}

export interface ToolHost {
  call(call: ToolCall): ToolResult;
}
