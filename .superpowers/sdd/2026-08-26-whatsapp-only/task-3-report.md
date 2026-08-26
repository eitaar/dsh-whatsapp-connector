# Task 3 report

## Status

Complete. WhatsApp-only documentation, dependency metadata, build configuration, package verification, notices, and assets were pruned and committed.

## Red/green verification

- **RED:** `npm test -- --test-name-pattern='documentation'`
  - Result: exit 1; 8 tests ran, 7 passed, 1 failed.
  - Failure: `documentation describes WhatsApp only`; stale `README.en.md` matched `| dingtalk |`.
- **GREEN:** `npm test -- --test-name-pattern='documentation|manifest keeps'`
  - Result: exit 0; 8 tests passed, 0 failed.
- **GREEN:** `npm run check`
  - Result: exit 0; Host and Client built, 8 tests passed, package verification printed `Verified dsh-im package artifacts.`.
- **Additional checks:** `git diff --check` passed; removed dependency names are absent from `package-lock.json`; README local asset-path scan found no broken local paths.

## Commit

`d244377` — `chore: prune connector to WhatsApp documentation`

## Concerns

- The SDD plan/ledger files remain unstaged as required.
- `NOTICE.md` already contained only retained upstream/WhatsApp attribution wording, so no change was needed.
- The unused Lark build patch was removed along with its now-unneeded build dependencies.

## Fix round

### Status

Complete. Review findings were addressed without changing the SDD plan or ledger files.

### Files

- `THIRD_PARTY_NOTICES.md` — enumerates retained direct React packages and retained Baileys transitive `libsignal`, `sharp`, and `@img/sharp-libvips-*` license coverage with factual copyright/license attribution.
- `plugin-src/client/i18n.js` — removes unused AI Office and generic channel metadata.
- `plugin-src/client/styles.js` — removes unused non-WhatsApp logo selectors.
- `lib/client.js` — regenerated client bundle.
- `test/whatsapp-only.test.mjs` — adds notice and retained metadata assertions.

### Commit

`7f04c1ff455d807a80ddd3698518465d0de7ad68` — `fix: address WhatsApp-only review findings`

### Verification

- `npm test -- --test-name-pattern='notices|metadata'`: exit 0; 10 passed, 0 failed.
- `npm run check`: exit 0; Host and Client built, 10 tests passed, `Verified dsh-im package artifacts.`
- `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`: exit 0; `up to date in 482ms`.
- License scan: `libsignal 6.0.0 GPL-3.0`; `sharp 0.35.4 Apache-2.0`; `@img/sharp-libvips-linux-x64 1.3.3 LGPL-3.0-or-later`.
- `git diff --check`: exit 0.

### Concerns

- The locale still contains legacy channel-specific operational messages used only as inert fallback keys; retained runtime imports are WhatsApp-only. The removed generic labels and logo selectors were confirmed unused.
- Untracked `docs/` content was not staged or modified.

## Fix round 2

### Status

Complete. Removed stale non-WhatsApp locale and metadata entries from the source and regenerated client bundle, while preserving the English `IM 渠道` accessibility label.

### Verification

- `npm test -- --test-name-pattern='retained client metadata|WhatsApp stream'`: exit 0; 10 passed, 0 failed.
- `npm run check`: exit 0; Host and Client built, 10 tests passed, `Verified dsh-im package artifacts.`
- Locale reference inspection: source and `lib/client.js` contain no Feishu/DingTalk/WeCom/WeChat/QQ/Telegram/Discord/Slack/Office locale references.
- `git diff --check`: exit 0.

### Commit

`edf6a8acb7db94b5fdf0d982ca44b5340080f632` — `fix: remove stale non-WhatsApp client locales`

### Concerns

- The SDD plan/ledger files and pre-existing untracked `docs/` content were not staged or modified.

## Fix round 3

### Status

Complete. Removed non-WhatsApp host locale modules and aggregate imports, removed unreachable non-WhatsApp selectors from shared client CSS, regenerated `lib/client.js`, and preserved WhatsApp channel-specific styles.

### Red/green verification

- **RED:** `npm test -- --test-name-pattern='shared locale aggregate and CSS'`
  - Result: exit 1; 10 passed, 1 failed.
  - Failure: `shared locale aggregate and CSS contain only retained identifiers`; stale `dingtalk` aggregate import matched.
- **GREEN:** `npm test -- --test-name-pattern='shared locale aggregate and CSS'`
  - Result: exit 0; 11 passed, 0 failed.

### Verification

- `npm run check`
  - Result: exit 0; Host and Client built, 11 tests passed, `Verified dsh-im package artifacts.`
- `npm pack --dry-run`
  - Result: exit 0; `@xmanrui/dsh-im@3.0.1`, 84 files; retained locale files listed were `shared-a.mjs`, `shared-b.mjs`, `shared-c.mjs`, and `whatsapp.mjs`.
- `git diff --check`
  - Result: exit 0.

### Commit

`6b85baa713d8a95f3eeb0909eb1c5f56b2603f29` — `fix: remove legacy shared locale and CSS`

### Concerns

- WhatsApp’s own bundled channel stylesheet intentionally retains `ddt-*`/`dwa-*` compatibility selectors; the cleanup test targets shared CSS only.
- The SDD plan/ledger files and pre-existing untracked `docs/` content were not staged or modified.

## Final fix round

### Status

Complete. Added the retained English translation for `扫码接入已取消。` in the WhatsApp locale and regenerated the host artifact. The focused regression assertion was added before the locale change and observed failing.

### Red/green verification

- **RED:** `npm test -- --test-name-pattern='retained English locale translates WhatsApp scan cancellation'`
  - Result: exit 1; 12 tests ran, 11 passed, 1 failed.
  - Failure: `retained English locale translates WhatsApp scan cancellation`; the retained locale lacked the English mapping.
- **GREEN:** `npm test -- --test-name-pattern='retained English locale translates WhatsApp scan cancellation'`
  - Result: exit 0; 12 tests passed, 0 failed.

### Verification

- `npm run check`
  - Result: exit 0; Host and Client built, 12 tests passed, `Verified dsh-im package artifacts.`
- `npm pack --dry-run`
  - Result: exit 0; `@xmanrui/dsh-im@3.0.1`, 84 files, package `xmanrui-dsh-im-3.0.1.tgz`.
- `git diff --check`
  - Result: exit 0; no output.

### Commit

`0dc3ffc67a2a2c34c8df0439202a9ed4cd2dc6de` — `fix: translate WhatsApp scan cancellation in English`

### Concerns

- `lib/index.js` changed because the host bundle embeds the retained host-side locale dictionary; `lib/client.js` was rebuilt and remained byte-identical.
- The SDD plan/ledger files and pre-existing untracked `docs/` content were not staged or modified.

## Final fix round 2

### Status

Complete. Removed Slack/Discord/Telegram-specific artifact permission branches, added exact retained bundled license texts, and strengthened package verification for license coverage, executable channel markers, and published runtime artifacts.

### Red/green verification

- **RED:** `npm test -- --test-name-pattern='artifact permission|exact retained|package verifier'` — exit 1; 12 passed, 3 failed for the new assertions.
- **GREEN:** same command — exit 0; 15 passed, 0 failed.

### Verification

- `npm run check` — exit 0; build succeeded, 15 tests passed, verifier printed `Verified dsh-im package artifacts.`.
- `npm pack --dry-run` — exit 0; `@xmanrui/dsh-im@3.0.1`, 94 files, including all `licenses/*.txt` files and no `node_modules` or runtime state.
- License/content scan — exit 0; exact installed Baileys, libsignal, protobufjs, sharp, qrcode, esbuild, React license texts copied; LGPL-3 text sourced from `/usr/share/common-licenses/LGPL-3` for the metadata-only sharp-libvips package.
- `git diff --check` — exit 0.

### Commit

`d27cf799630b0e032a17b4ef42a0abf79c1d7f35` — `fix: add bundled license coverage and WhatsApp artifact checks`

### Concerns

- sharp-libvips publishes SPDX metadata but no license text file; the shipped LGPL text is the system's authoritative GNU license text.
- The SDD plan/ledger files and pre-existing untracked `docs/` content remain unstaged.

