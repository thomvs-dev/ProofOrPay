# Contributing

## Development

- **Contracts:** `cd contracts && cargo test --manifest-path stake_pool/Cargo.toml`
- **Frontend:** `cd frontend && npm install && npm run dev`
- **Testnet verify:** `cd frontend && npm run verify:testnet`

## Pull requests

- Keep commits focused; reference issues when applicable.
- Run `npm run lint` and `npm run build` in `frontend/` before pushing.
- For contract changes, add/update tests under `contracts/stake_pool/src/test.rs`.

## First-time contributors

See [`docs/COMMUNITY.md`](docs/COMMUNITY.md).
