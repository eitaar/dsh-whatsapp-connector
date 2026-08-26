# WhatsApp-only Connector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce `eitaar/dsh-whatsapp-connector` to a WhatsApp-only DSH connector while preserving the shared Harness infrastructure, package compatibility identity, streaming edits, and correct licensing.

**Architecture:** Keep the existing WhatsApp host/client adapters and shared modules they import. Rewrite the host and settings client registries to expose only WhatsApp, then remove unreferenced channel adapters, assets, dependencies, and documentation. The package continues to identify internally as `@xmanrui/dsh-im` / `xmanrui-dsh-im` for DSH compatibility while the GitHub repository remains `eitaar/dsh-whatsapp-connector`.

**Tech Stack:** Node.js 24, ESM, React client bundle, esbuild, Baileys 7.0.0-rc14, npm, node:test, DSH plugin bundle verifier.

**Spec:** `docs/superpowers/specs/2026-08-26-whatsapp-only.md`

## Global Constraints

- Repository-only change; do not modify `/home/ubuntu/.dsh` or restart the live relay.
- Keep the internal DSH identity `@xmanrui/dsh-im` / `xmanrui-dsh-im`.
- Keep WhatsApp streaming at `5_000` ms and the English `Processing…` placeholder.
- Keep MIT upstream attribution in `LICENSE`, `NOTICE.md`, and applicable third-party notices.
- Never commit `node_modules`, credentials, auth state, or runtime state.

---

### Task 1: Add WhatsApp-only registration regression tests

**Files:**
- Create: `test/whatsapp-only.test.mjs`
- Read: `plugin-src/host/index.mjs`, `plugin-src/client/index.js`, `package.json`, `cordis.patch.yml`

**Interfaces:**
- Consumes the current host/client source and package manifest as UTF-8 text.
- Produces tests that fail while removed channels are still registered and pass after pruning.

- [ ] **Step 1: Write the failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const removed = ['dingtalk', 'discord', 'feishu', 'office', 'qq', 'slack', 'telegram', 'wecom', 'weixin'];

test('host registers WhatsApp only', async () => {
  const source = await read('plugin-src/host/index.mjs');
  assert.match(source, /applyWhatsapp/);
  for (const channel of removed) assert.doesNotMatch(source, new RegExp(`(?:apply|start|channel).*${channel}`, 'i'));
});

test('client imports and lists WhatsApp only', async () => {
  const source = await read('plugin-src/client/index.js');
  assert.match(source, /WhatsappSettingsTab/);
  for (const channel of removed) assert.doesNotMatch(source, new RegExp(`(?:SettingsTab|LogoGlyph|RPC_CHANNEL|install).*${channel}`, 'i'));
  assert.match(source, /id: 'whatsapp'/);
});

test('manifest keeps only WhatsApp runtime dependencies', async () => {
  const manifest = JSON.parse(await read('package.json'));
  for (const dependency of ['@tencent-connect/qqbot-connector', '@tencent-connect/qqbot-nodejs', '@wecom/aibot-node-sdk', 'dingtalk-stream']) {
    assert.equal(manifest.dependencies?.[dependency], undefined, dependency);
  }
  assert.equal(manifest.dependencies?.qrcode, '1.5.4');
  assert.equal(manifest.devDependencies?.['@whiskeysockets/baileys'], '7.0.0-rc14');
});

test('bundle patch retains DSH compatibility identity', async () => {
  const patch = await read('cordis.patch.yml');
  assert.match(patch, /name: '@xmanrui\/dsh-im'/);
});
```

- [ ] **Step 2: Run the tests and verify they fail for the intended reason**

Run: `npm test -- --test-name-pattern='host registers|client imports|manifest keeps'`

Expected: FAIL because the current source still registers non-WhatsApp adapters and declares their dependencies.

- [ ] **Step 3: Commit the test-only red state only after confirming the failure**

Do not commit a red test; continue directly to Task 2 after recording the expected failure.

### Task 2: Prune host and client registrations

**Files:**
- Modify: `plugin-src/host/index.mjs:1-51`
- Modify: `plugin-src/client/index.js:1-68` and channel tab/style registration sections
- Modify: `plugin-src/client/channel-logos.js`
- Modify: `plugin-src/client/channels/whatsapp/index.js`
- Delete: `plugin-src/host/channels/dingtalk/`, `discord/`, `feishu/`, `office/`, `qq/`, `slack/`, `telegram/`, `wecom/`, `weixin/`
- Delete: `plugin-src/client/channels/dingtalk/`, `discord/`, `feishu/`, `office/`, `qq/`, `slack/`, `telegram/`, `wecom/`, `weixin/`
- Delete: `plugin-src/client/channels/shared/` only if the final import scan proves no retained client module uses it
- Test: `test/whatsapp-only.test.mjs`

**Interfaces:**
- Consumes `WhatsappSettingsTab`, `WHATSAPP_RPC_CHANNEL`, `installWhatsappStyles`, `applyWhatsapp`, and shared client utilities used by WhatsApp.
- Produces a host bundle with one channel tuple `['whatsapp', startWhatsapp]` and a client settings page whose `CHANNELS` list contains only WhatsApp.

- [ ] **Step 1: Remove non-WhatsApp host imports and channel tuples**

Retain only:

```js
import { apply as applyWhatsapp } from './channels/whatsapp/index.mjs';
```

and:

```js
const startWhatsapp = internals.applyWhatsapp ?? applyWhatsapp;
const channels = [['whatsapp', startWhatsapp]];
```

Keep artifact installation, locale setup, logging, and `channelConfig` behavior unchanged.

- [ ] **Step 2: Remove non-WhatsApp client imports, components, and channel list entries**

Retain WhatsApp imports, shared settings infrastructure, and:

```js
const CHANNELS = Object.freeze([
  { id: 'whatsapp', label: 'WhatsApp' },
]);
```

Delete unused logo functions, tab imports, RPC constants, style installers, and switch branches for removed channels. Keep the existing WhatsApp tab and its shared workspace/preset/error components.

- [ ] **Step 3: Move the required DingTalk QR styles into WhatsApp before deleting DingTalk**

`plugin-src/client/channels/whatsapp/index.js` currently imports `installDingtalkStyles`. Copy the required QR/layout CSS into a new WhatsApp-owned helper in `plugin-src/client/channels/whatsapp/styles.js`, export `installWhatsappStyles` as the only WhatsApp style installer, and remove the DingTalk import/call. Preserve the existing `container-type: inline-size` and narrow-panel behavior.

- [ ] **Step 4: Delete the non-WhatsApp adapter directories**

Remove only the listed non-WhatsApp directories after the source imports no longer reference them. Do not delete `plugin-src/host/channels/shared/` or retained shared client utilities needed by WhatsApp.

- [ ] **Step 5: Run the focused tests and verify they pass**

Run: `npm test -- --test-name-pattern='host registers|client imports|manifest keeps|bundle patch'`

Expected: PASS with all four registration/manifest tests green.

### Task 3: Prune source dependencies, assets, and documentation

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `README.md`, `README.en.md`
- Modify: `THIRD_PARTY_NOTICES.md`
- Modify: `NOTICE.md` if its wording names removed components
- Delete: non-WhatsApp logo assets from `assets/` after confirming no retained README/client import references
- Test: `test/whatsapp-only.test.mjs`

**Interfaces:**
- Consumes the retained WhatsApp host/client import graph.
- Produces a package manifest and lockfile containing only dependencies required by the WhatsApp connector build/runtime.

- [ ] **Step 1: Add failing dependency and documentation assertions**

Extend `test/whatsapp-only.test.mjs` with:

```js
test('documentation describes WhatsApp only', async () => {
  const readme = await read('README.en.md');
  assert.match(readme, /WhatsApp/);
  for (const channel of removed) assert.doesNotMatch(readme, new RegExp(`\\| ${channel} \\|`, 'i'));
});
```

Run: `npm test -- --test-name-pattern='documentation'`

Expected: FAIL while the README still contains non-WhatsApp channel rows.

- [ ] **Step 2: Remove unused dependencies and regenerate the lockfile**

Remove runtime dependencies `@tencent-connect/qqbot-connector`, `@tencent-connect/qqbot-nodejs`, `@wecom/aibot-node-sdk`, and `dingtalk-stream`. Remove build-only dependencies for non-retained channels (`@larksuiteoapi/node-sdk`, `https-proxy-agent`) if the import scan confirms they are unused. Retain `qrcode`, Baileys, esbuild, React, and any package directly required by retained code. Run:

```bash
npm install --package-lock-only --ignore-scripts --no-audit --no-fund
```

- [ ] **Step 3: Remove non-WhatsApp README sections and unused assets**

Keep WhatsApp setup, access policy, streaming behavior, installation, DSH identity compatibility, and licensing text. Remove tables/sections that describe deleted adapters. Delete only assets no longer referenced by retained README/client source, then verify no broken local asset paths remain.

- [ ] **Step 4: Narrow third-party notices**

Remove notices for deleted DingTalk, Weixin, Lark, and other removed integrations. Keep notices for Baileys, qrcode, protobufjs, retained dependencies, Simple Icons assets still used, and the upstream `xmanrui/dsh-im` derivative attribution.

- [ ] **Step 5: Run documentation/dependency tests and verify they pass**

Run: `npm test -- --test-name-pattern='documentation|manifest keeps'`

Expected: PASS.

### Task 4: Rebuild and strengthen package verification

**Files:**
- Modify: `scripts/verify-package.mjs`
- Modify: `lib/index.js`, `lib/client.js` (generated)
- Test: `test/whatsapp-only.test.mjs`

**Interfaces:**
- Consumes the WhatsApp-only source tree and package manifest.
- Produces generated bundles and a verifier that rejects any non-WhatsApp registration/import/dependency.

- [ ] **Step 1: Add a failing verifier assertion for removed channel markers**

Add exact registration assertions against the retained source entry points:

```js
test('retained source registers only WhatsApp', async () => {
  const host = await read('plugin-src/host/index.mjs');
  const client = await read('plugin-src/client/index.js');
  assert.match(host, /applyWhatsapp/);
  assert.match(host, /\['whatsapp',\s*startWhatsapp\]/);
  for (const marker of [
    'applyDingtalk', 'applyDiscord', 'applyFeishu', 'applyOffice',
    'applyQq', 'applySlack', 'applyTelegram', 'applyWecom', 'applyWeixin',
  ]) assert.doesNotMatch(host, new RegExp(marker));
  for (const marker of [
    'DingtalkSettingsTab', 'DiscordSettingsTab', 'FeishuSettingsTab',
    'OfficeSettingsTab', 'QqSettingsTab', 'SlackSettingsTab',
    'TelegramSettingsTab', 'WecomSettingsTab', 'WeixinSettingsTab',
  ]) assert.doesNotMatch(client, new RegExp(marker));
  assert.match(client, /WhatsappSettingsTab/);
});
```

This test checks registration identifiers rather than generic words or bundled dependency text.

- [ ] **Step 2: Run the test to verify it fails before rebuilding**

Run: `npm test -- --test-name-pattern='built bundles'`

Expected: FAIL because the current generated bundles still contain deleted channel registrations.

- [ ] **Step 3: Rewrite `scripts/verify-package.mjs` for one retained channel**

Keep checks for executable mode, DSH settings section, workspace/session markers, no external channel plugin imports, pinned direct dependencies, bundled SDK restrictions, and secret markers. Change channel checks to require WhatsApp and reject removed channel source/patch/manifest markers without rejecting unrelated words.

- [ ] **Step 4: Rebuild and run the focused test**

Run:

```bash
npm run build
npm test -- --test-name-pattern='built bundles|host registers|client imports'
```

Expected: PASS.

### Task 5: Full verification, review, commit, and push

**Files:**
- Modify: any generated bundles or lockfile changes from Tasks 2–4
- Test: all repository tests

- [ ] **Step 1: Run the complete package checks**

Run:

```bash
npm run check
npm pack --dry-run
```

Expected: build succeeds, all tests pass, package verifier prints `Verified dsh-im package artifacts.`, and the tarball contains no `node_modules` or runtime state.

- [ ] **Step 2: Review the final tree and license files**

Run:

```bash
git status --short
git diff --check
git grep -n -E 'dingtalk|discord|feishu|qq|slack|telegram|wecom|weixin' -- ':!README*' ':!THIRD_PARTY_NOTICES.md' ':!package-lock.json'
```

Expected: no retained source/registration hits for removed adapters; any intentional historical/license text must be documented and not executable registration code.

- [ ] **Step 3: Commit the WhatsApp-only reduction**

```bash
git add -A
git commit -m "refactor: reduce connector to WhatsApp"
```

- [ ] **Step 4: Push to the existing public repository**

```bash
git push origin main
```

- [ ] **Step 5: Verify the remote and clean tree**

```bash
git status --short
gh repo view eitaar/dsh-whatsapp-connector --json nameWithOwner,isPrivate,defaultBranchRef,url,licenseInfo
```

Expected: clean tree, public `eitaar/dsh-whatsapp-connector`, MIT license, and `main` pointing at the new commit.
