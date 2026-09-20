# commerce-ops-agents

Autonomous agent crew for a print / commerce shop. Agents do the work, tools talk to the store, and eval **turns off** anything that does not deliver.

This is the code sample for Sticker Mule's AI agent engineer role. It is a local, deterministic demo (no API keys). Swap the agent `run()` bodies for Grok, Claude, OpenAI, or an open-source model when you wire a real model.

## What it does

| Agent | Job | Tools |
|---|---|---|
| `catalog-copy` | Write and publish product listings | `read_sku`, `publish_listing` |
| `proof-qa` | Hold or approve print files | `inspect_artwork` |
| `support-triage` | Draft a real reply (reprint, tracking, rush) | `list_open_tickets`, `draft_reply` |
| `legacy-blurb` | Keyword-stuffed copy that ignores facts | none — **eval disables it** |

Orchestrator routes a shift of jobs, scores success / cost / latency, and skips disabled agents on the next shift.

Maps to the role:

- Identify where agents help and build them (catalog, proof, support)
- Connect agents to internal tools (SKU, artwork, tickets, publish)
- Measure results and remove agents that do not deliver (kill switch)
- Prefer what works; keep the runtime model-agnostic

## Run

```bash
npm install
npm run demo
```

You should see shift 1 fail `legacy-blurb`, disable it, then shift 2 skip it while the other three keep working.

```bash
npm run typecheck
```

## Layout

```
src/
  index.ts           CLI: two shifts + scoreboard
  orchestrator.ts    route, run, record, skip disabled
  types.ts
  agents/            catalog, proof, support, underperformer
  tools/             fake shop APIs
  eval/store.ts      scores + kill threshold
  data/jobs.ts       fake print-shop queue
```

Eval rule: after 2 jobs, success rate below 50% disables the agent.

## Note

Print-shop SKUs and tickets are synthetic. No client data, no credentials.
