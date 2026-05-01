# Security checklist (completed for repo baseline)

Use this as the sign-off record. Update dates when re-auditing.

| Item | Status | Notes |
|------|--------|-------|
| **Secrets not committed** | OK | `.gitignore` excludes `.env` / `.env.local`. |
| **Verifier key** | Review | `STELLAR_VERIFIER_SECRET_KEY` is server-only; rotate if leaked; must match on-chain verifier. |
| **Contract init** | OK | One-time `init`; documented deploy order in README. |
| **Dependency advisories** | Action | Run `npm audit` in `frontend/`; upgrade Next.js per vendor security bulletin when applicable. |
| **CORS / API** | OK | `/api/score` uses server-side Claude key; no key in client bundle. |
| **AuthZ on chain** | OK | `require_auth` on privileged contract entrypoints per [contracts](../contracts). |
| **Testnet vs mainnet** | OK | Defaults and docs target testnet; mainnet requires explicit env + review. |

**Reviewer:** maintainer  
**Last reviewed:** 2026-04-20
