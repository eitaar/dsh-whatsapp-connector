# Task 5 Verification Report

Date: 2026-08-27
Branch: `refactor/whatsapp-only`
HEAD: `d3aa097 docs: make connector migration guidance actionable`

## Status

Verification completed without modifying tracked repository files. No commit, push, or PR operation was performed.

## Full verification gate

- `npm run check`: exit 0. Build rewrote `lib/client.js` and `lib/index.js`; 22 tests passed, 0 failed. Verifier output: `Verified dsh-whatsapp-connector package artifacts.`
- `npm test`: exit 0. 22 tests passed, 0 failed; duration `504.358992ms`.
- `npm pack --dry-run`: exit 0. Package output was `dsh-whatsapp-connector-3.0.1.tgz`; npm reported name `dsh-whatsapp-connector`, version `3.0.1`, 95 files, package size `2.8 MB`, unpacked size `7.7 MB`.
- `node scripts/verify-package.mjs`: exit 0; output exactly `Verified dsh-whatsapp-connector package artifacts.`
- `git diff --check origin/main...HEAD`: exit 0; no output.

## Active old-name audit

Command run:

```bash
git grep -n -E 'dsh-im|xmanrui-dsh-im|@xmanrui/dsh-im|DSH_IM_' -- ':!test/**' ':!docs/superpowers/**' ':!THIRD_PARTY_NOTICES.md' ':!NOTICE.md' ':!bin/migration.mjs'
```

Result: **not clean**. Hits remain in `README.en.md` (2), `README.md` (2), and `scripts/verify-package.mjs` (6 regex guard patterns). The excluded historical contexts contain the expected hits in `NOTICE.md`, `THIRD_PARTY_NOTICES.md`, `bin/migration.mjs`, and `docs/superpowers/**`; the old-name audit also found the historical prior report under `.superpowers/sdd/2026-08-26-whatsapp-only/`, which is outside the explicit exclusion glob.

This does not satisfy the brief's stated expectation of no active-audit hits. The README references are attribution/migration guidance, and the verifier references are negative assertions, but both remain in paths that the prescribed audit does not exclude. No tracked files were changed because the instruction forbade modifying tracked files absent an objectively required generated/whitespace fix; controller/reviewer decision is needed on whether those intentional references should be permitted or the audit exclusions adjusted.

## Artifact review

A package was created in `/tmp/dsh-whatsapp-pack` for inspection and removed afterward. npm reported:

```text
name: dsh-whatsapp-connector
version: 3.0.1
filename: dsh-whatsapp-connector-3.0.1.tgz
total files: 95
```

The archive contains `package/bin/dsh-whatsapp-connector.mjs`, `package/LICENSE`, `package/NOTICE.md`, `package/THIRD_PARTY_NOTICES.md`, and all ten retained `package/licenses/*.txt` files. No archive entries matched `node_modules`, `.dsh`, credentials/auth/session/state/runtime paths. Retained channel directories are only `src/channels/shared`, `src/channels/whatsapp`, `plugin-src/client/channels/whatsapp`, and `plugin-src/host/channels/{shared,whatsapp}`; no other channel directories are tracked.

## WhatsApp behavior review

`src/channels/whatsapp/whatsapp-runtime.mjs` retains:

- `WHATSAPP_STREAM_UPDATE_INTERVAL_MS = 5_000`
- `initialText: 'Processing…'`
- native mention propagation on initial and edited messages
- mention propagation in overflow chunks
- loop protection comment and reservation logic before dispatch

The initial `/home/ubuntu/.dsh` directory mtime was `2026-08-27 10:29:25.422464194 +0000` both before and after verification. No live relay was restarted and no runtime/auth state was added.

## Repository state and concerns

`git status --short` was clean after verification. No commit was created.

Primary concern: the prescribed active old-name audit exits with hits in README files and `scripts/verify-package.mjs`, contrary to the brief's expected zero-hit result. A secondary concern is that the prior historical report path is not covered by the explicit exclusion glob. These are reported for controller review; no source or documentation changes were made.

## Final fix round

Date: 2026-08-27

Addressed the audit concern in commit `928929d73fe3286b97cc43cf4286450b03833746` (`fix: centralize legacy identity verification markers`). `bin/migration.mjs` now exports the side-effect-free frozen `LEGACY_ACTIVE_IDENTITY_MARKERS` list; `scripts/verify-package.mjs` imports and scans with it across the active manifest, CLI, source, plugin source, bundles, and Cordis patch text. The regression suite verifies the centralized import/list and scans active registrations for stale identities. README attribution/migration guidance was preserved.

Corrected active-name audit:

```text
git grep -n -E 'dsh-im|xmanrui-dsh-im|@xmanrui/dsh-im|DSH_IM_' -- ':!README.md' ':!README.en.md' ':!NOTICE.md' ':!THIRD_PARTY_NOTICES.md' ':!bin/migration.mjs' ':!test/**' ':!docs/superpowers/**' ':!.superpowers/**' || true
(no output; exit 0)
```

Final fix-round verification output:

- `node --test test/whatsapp-only.test.mjs`: exit 0; 20 passed, 0 failed.
- `npm run check`: exit 0; 23 passed, 0 failed; `Verified dsh-whatsapp-connector package artifacts.`
- `npm test`: exit 0; 23 passed, 0 failed.
- `npm pack --dry-run`: exit 0; `dsh-whatsapp-connector-3.0.1.tgz`; name `dsh-whatsapp-connector`; 95 files.
- `git diff --check`: exit 0; no output.
- Final active-name audit: exit 0; no output in non-explicitly-allowed contexts.

The final report update is documentation-only and was committed separately; no push, live relay restart, `/home/ubuntu/.dsh` modification, or runtime/auth state change was performed.
