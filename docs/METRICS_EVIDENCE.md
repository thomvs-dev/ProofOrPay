# Active users / adoption evidence

The repository does **not** embed personal data or third-party analytics credentials.

| Requirement | How to verify | Artifact |
|---------------|----------------|----------|
| **30+ verified active users** | Use your hosting analytics (e.g. Vercel Analytics, Plausible, GA4) or wallet connect server logs **without** storing raw secrets in git. | Export a screenshot or PDF and link it from your deployment runbook; do not commit PII. |

**Dashboard:** [`/metrics`](../frontend/src/app/metrics/page.tsx) shows **on-chain** pool/member counts when `METRICS_SIMULATION_PUBLIC_KEY` is configured — this is *protocol* activity, not necessarily “verified humans.”

Record thresholds in [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) when evidence is gathered.
