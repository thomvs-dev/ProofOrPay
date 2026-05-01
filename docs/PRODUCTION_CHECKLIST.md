# Production readiness checklist (mapping)

Maps rubric items to artifacts in this repo.

| Requirement | Artifact / proof |
|-------------|------------------|
| **30+ verified active users** | [`METRICS_EVIDENCE.md`](METRICS_EVIDENCE.md) — operator-hosted evidence (analytics export), not committed secrets |
| **Metrics dashboard live** | [`/metrics`](../frontend/src/app/metrics/page.tsx), [`/api/metrics`](../frontend/src/app/api/metrics/route.ts) |
| **Security checklist** | [`SECURITY_CHECKLIST.md`](SECURITY_CHECKLIST.md) |
| **Monitoring** | [`MONITORING.md`](MONITORING.md), [`/api/health`](../frontend/src/app/api/health/route.ts), CI workflows |
| **Data indexing** | [`INDEXING.md`](INDEXING.md) — RPC-based reads + optional snapshots |
| **Full documentation** | [README](../README.md), this folder, [RUNBOOK](RUNBOOK.md), [VERIFICATION_MATRIX](VERIFICATION_MATRIX.md) |
| **1 community contribution** | [`COMMUNITY.md`](COMMUNITY.md), [`CONTRIBUTING.md`](../CONTRIBUTING.md) |
| **1 advanced feature** | AI scoring + `record_ai_verdict` — [PROTOCOL.md](PROTOCOL.md), [`frontend/src/app/api/score/route.ts`](../frontend/src/app/api/score/route.ts) |
| **15+ meaningful commits** | Git history on `main`; maintainers use small focused commits |
| **Production-ready app** | CI green; deploy checklist above; testnet evidence in [`TESTNET_EVIDENCE.json`](TESTNET_EVIDENCE.json) |
| **Testnet deployed** | README contract IDs + init txs; [`TESTNET_EVIDENCE.json`](TESTNET_EVIDENCE.json) |
| **All functions invoked** | Read-only automated in `verify-testnet.mjs`; **writes** require txs documented in `TESTNET_EVIDENCE.json` (see [VERIFICATION_MATRIX](VERIFICATION_MATRIX.md)) |
