# AGC Protocol TODOs

Remaining work checklist toward production launch of the Solana program and web surface.

## Solana Program

- [x] Add direct Pyth validation for collateral oracle cache updates.
- [ ] Aggregate reserve value from actual configured reserve token accounts instead of passing reserve metrics manually into settlement.
- [x] Add a constrained buyback campaign executor that releases USDC slices only after AGC is delivered and burned.
- [x] Document the Raydium-first buyback adapter MVP around the constrained campaign primitive.
- [x] Add local-validator Anchor tests for initialization and freeze-authority rejection across real SPL mint/token accounts.
- [x] Add deeper local-validator tests for credit draw, repayment, default, and collateral seizure across real SPL token accounts. Covers credit lifecycle (deposit → draw → repay), xAGC round-trip with exit fee, and default + collateral seize.
- [x] Split monolithic `programs/agc_solana/src/lib.rs` (6.8k lines) into modules: `state`, `events`, `policy`, `credit`, `validation`, `auth`, `math`, `pyth`, `cpi`, `tests`. lib.rs is now 2.8k lines holding only `#[program]` handlers, `#[derive(Accounts)]` contexts, and `#[error_code]`.
- [x] Fix SBF stack-frame overflows in `DrawCreditLine.try_accounts` and `StartBuybackCampaign.try_accounts`. Both produced runtime `Access violation` failures pre-fix; resolved by relocating selected `seeds`/`address` constraints into handler-level `require_keys_eq!` checks.
- [ ] Add migration playbooks for future account-version upgrades.
- [ ] Decide final launch multisig structure for admin, risk, emergency, and upgrade authorities.
- [x] Define launch parameter presets for USDC, USDT, the first BTC wrapper, and disabled RWA assets.

## Frontend

- [ ] Wire the dashboard to the deployed Solana IDL/client.
- [ ] Read live `ProtocolState`, collateral registry, credit facility, xAGC vault, and treasury token account data.
- [ ] Submit live xAGC deposit/redeem transactions.
- [ ] Submit live credit facility transactions: underwrite, deposit collateral, draw, repay, and withdraw where allowed.
- [ ] Add facility detail pages for collateral health, maturity, debt, reserve coverage, underwriter reserve, and default state.
- [ ] Keep Jupiter swap panel enabled once the AGC mint is deployed and routed.

## Docs

- [ ] Add a deployment guide with exact Solana accounts, PDA seeds, authority setup, and environment variables.
- [x] Add a risk-parameter reference for stablecoins, BTC wrappers, and isolated RWAs.
- [x] Add user-facing examples for xAGC, credit borrowers, underwriters, and liquidations.
- [x] Add an upgrade/migration runbook explaining production upgrade controls.
- [x] Reconcile `policy-sheet.md §15` recommended launch values with `risk-parameter-presets.md` (single source of truth for launch parameters).
- [ ] Keep `/llms.txt` and `/llms-full.txt` in sync with product docs after every protocol change.

## Tooling & Simulator

- [x] Extend Python policy simulator (`script/simulate_policy.py`) with stable cash coverage, liquidity depth coverage, oracle confidence/staleness, and collateral concentration gates so it mirrors on-chain `evaluate_epoch`.
- [x] Update `configs/policy/launch-model.json` schema with the new policy parameter sections.
- [x] Add `oracle-degradation` scenario to `configs/policy/scenarios.json` exercising the oracle health gate (Neutral → Expansion → Defense → Recovery).
- [x] Remove dead EVM-era `script/simulatePolicy.mjs` and its `simulate:policy` `package.json` script.

## Launch Readiness

- [ ] Complete an external Solana security review. Specifically include the relocated constraint checks in `DrawCreditLine` (credit_line seeds → handler `constraint`) and `StartBuybackCampaign` (treasury/mint `address` constraints → handler `require_keys_eq!`).
- [ ] Extend adversarial test coverage: stale oracle data, wrong mint accounts, underwriter reserve drain, overdraw beyond collateral factor, underwriter loss accounting on uncovered defaults, collateral seizure routing edge cases.
- [ ] Publish deployed program ID, IDL, mint addresses, treasury addresses, and multisig addresses.
- [ ] Run a staged devnet launch before production deployment.
- [ ] Define operational monitoring for policy settlement, oracle freshness, reserve balances, credit health, and emergency pause events.
