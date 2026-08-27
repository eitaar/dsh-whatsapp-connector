# dsh-whatsapp-connector Full Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the WhatsApp-only DSH plugin from its inherited `dsh-im` identity to the distinct unscoped package/plugin identity `dsh-whatsapp-connector`.

**Architecture:** Replace the active package, CLI, Cordis, client-loader, settings, runtime, storage, and bundle identities with `dsh-whatsapp-connector`. Keep the old installation untouched and isolate the new plugin under `~/.dsh/integrations/dsh-whatsapp-connector/`; detect the legacy `~/.dsh/integrations/dsh-whatsapp/` namespace and provide non-destructive guidance only.

**Tech Stack:** Node.js 24, ESM, React, esbuild, Baileys 7.0.0-rc14, npm, node:test, DSH Cordis plugin bundles, GitHub CLI.

**Spec:** `docs/superpowers/specs/2026-08-27-dsh-whatsapp-connector-rename-design.md`

## Global Constraints

- Rename the active npm package, CLI, Cordis/plugin identity, client loader identity, settings-section identity, bundle/style identifiers, verifier messages, and user-facing documentation to `dsh-whatsapp-connector`.
- Keep the repository at `eitaar/dsh-whatsapp-connector`.
- Keep the existing WhatsApp streaming behavior, shared Harness/session infrastructure, native mentions, overflow delivery, and 5,000 ms edit interval unchanged.
- Use a new integration namespace at `~/.dsh/integrations/dsh-whatsapp-connector/`.
- Detect the legacy `~/.dsh/integrations/dsh-whatsapp/` namespace and provide migration guidance without overwriting, deleting, or modifying it.
- Do not modify the currently installed plugin under `/home/ubuntu/.dsh` during implementation.
- Preserve upstream MIT attribution for the project’s `@xmanrui/dsh-im` origin in `LICENSE`, `NOTICE.md`, and applicable third-party notices; that historical attribution is not an active plugin identity.
- Active runtime code must not register `@xmanrui/dsh-im` or `xmanrui-dsh-im`.
- The old name may appear only in explicit historical attribution or migration guidance.
- DSH host API packages under `@deepseek-ai/dsh-*` are host-provided dependencies and are not part of this plugin rename.

---

## File and Interface Map

- `package.json`: published package name, binary map, scripts, and DSH metadata.
- `package-lock.json`: npm lockfile root/package identity and dependency graph.
- `bin/dsh-whatsapp-connector.mjs`: renamed installer/uninstaller CLI; no automatic removal of legacy plugins.
- `bin/migration.mjs`: pure legacy-root detection and warning formatting used by the CLI and tests.
- `cordis.patch.yml`: sole active Cordis registration.
- `plugin-src/client/build.mjs`: default client loader ID.
- `plugin-src/client/index.js`: settings section ID, visible branding, GitHub link, and client style/plugin identity.
- `plugin-src/client/i18n.js`: active locale namespace and new plugin wording.
- `plugin-src/client/styles.js`, `plugin-src/client/channels/whatsapp/styles.js`: generated DOM/style identity strings.
- `plugin-src/host/index.mjs`: host plugin name, logger labels, language environment variable, and aggregate errors.
- `plugin-src/host/channels/whatsapp/production.mjs`: default integration data root and runtime logger labels.
- `src/channels/shared/*.mjs`, `src/channels/whatsapp/*.mjs`: active runtime logger/tool/artifact identity strings that currently say `dsh-im`.
- `lib/client.js`, `lib/index.js`: generated artifacts rebuilt from the source entry points; never hand-edit.
- `scripts/verify-package.mjs`: package identity, source-marker, bundle, storage, and published-artifact checks.
- `README.md`, `README.en.md`, `NOTICE.md`, `THIRD_PARTY_NOTICES.md`: installation, migration, attribution, and license documentation.
- `test/whatsapp-only.test.mjs`: identity, migration, bundle, and package regression tests.

---

### Task 1: Add failing identity and migration regression tests

**Files:**
- Modify: `test/whatsapp-only.test.mjs`
- Read: `package.json`, `cordis.patch.yml`, `plugin-src/client/build.mjs`, `plugin-src/client/index.js`, `plugin-src/host/index.mjs`, `plugin-src/host/channels/whatsapp/production.mjs`, `bin/dsh-im.mjs`
- Create in a later task: `bin/migration.mjs`, `bin/dsh-whatsapp-connector.mjs`

**Interfaces:**
- Consumes UTF-8 source and manifest files plus the future `hasLegacyData(dshHome)` contract.
- Produces red tests that define the active identity and isolate legacy storage before any implementation rename.

- [ ] **Step 1: Write failing active-identity assertions**

Append these assertions to `test/whatsapp-only.test.mjs`:

Extend the existing `node:fs/promises` import with `access`, `mkdtemp`, `mkdir`, `readFile`, `rm`, and `writeFile`, then add the path imports:

```js
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('active package and DSH registration use dsh-whatsapp-connector', async () => {
  const packageManifest = JSON.parse(await read('package.json'));
  assert.equal(packageManifest.name, 'dsh-whatsapp-connector');
  assert.deepEqual(packageManifest.bin, { 'dsh-whatsapp-connector': 'bin/dsh-whatsapp-connector.mjs' });
  assert.equal(packageManifest.exports['./package.json'], './package.json');

  const lock = JSON.parse(await read('package-lock.json'));
  assert.equal(lock.name, 'dsh-whatsapp-connector');
  assert.equal(lock.packages[''].name, 'dsh-whatsapp-connector');
  assert.match(await read('cordis.patch.yml'), /id: dsh-whatsapp-connector/);
  assert.match(await read('cordis.patch.yml'), /name: dsh-whatsapp-connector/);
  assert.match(await read('plugin-src/client/build.mjs'), /'dsh-whatsapp-connector'/);
  assert.match(await read('plugin-src/client/index.js'), /id: 'dsh-whatsapp-connector'/);
  assert.match(await read('plugin-src/host/index.mjs'), /export const name = 'dsh-whatsapp-connector-host'/);
});

test('active runtime paths use the new integration namespace', async () => {
  const source = await read('plugin-src/host/channels/whatsapp/production.mjs');
  assert.match(source, /integrations', 'dsh-whatsapp-connector'/);
  assert.doesNotMatch(source, /integrations', 'dsh-whatsapp'/);
});

test('renamed CLI is published and inherited CLI is absent', async () => {
  await access(new URL('../bin/dsh-whatsapp-connector.mjs', import.meta.url));
  await assert.rejects(
    access(new URL('../bin/dsh-im.mjs', import.meta.url)),
    { code: 'ENOENT' },
  );
});
```

- [ ] **Step 2: Write failing legacy-root test**

Add the test with a dynamic import so the rest of the red test file still runs before the new module exists:

```js
test('legacy data detection is path-only and non-destructive', async () => {
  const { hasLegacyData } = await import('../bin/migration.mjs');
  const dshHome = await mkdtemp(join(tmpdir(), 'dsh-whatsapp-rename-'));
  const legacyRoot = join(dshHome, 'integrations', 'dsh-whatsapp');
  const marker = join(legacyRoot, 'state.json');
  try {
    assert.equal(await hasLegacyData(dshHome), false);
    await mkdir(legacyRoot, { recursive: true });
    await writeFile(marker, 'sentinel', 'utf8');
    assert.equal(await hasLegacyData(dshHome), true);
    assert.equal(await readFile(marker, 'utf8'), 'sentinel');
  } finally {
    await rm(dshHome, { recursive: true, force: true });
  }
});
```

- [ ] **Step 3: Run the new tests and verify the expected red state**

Run: `node --test test/whatsapp-only.test.mjs --test-name-pattern='active package|active runtime|renamed CLI|legacy data'`

Expected: FAIL because the manifest, Cordis patch, loader, runtime root, CLI filename, and migration module still use the inherited identity.

- [ ] **Step 4: Keep the corrected failing tests for Task 2**

Do not commit a red test. The corrected failing tests remain in the working tree and are committed together with the first passing implementation.

### Task 2: Rename package, CLI, Cordis, client, and host identities

**Files:**
- Modify: `package.json`, `package-lock.json`
- Rename: `bin/dsh-im.mjs` → `bin/dsh-whatsapp-connector.mjs`
- Create: `bin/migration.mjs`
- Modify: `cordis.patch.yml`
- Modify: `plugin-src/client/build.mjs`, `plugin-src/client/index.js`, `plugin-src/client/i18n.js`, `plugin-src/client/styles.js`, `plugin-src/client/channels/whatsapp/styles.js`
- Modify: `plugin-src/host/index.mjs`, `plugin-src/host/channels/whatsapp/production.mjs`
- Test: `test/whatsapp-only.test.mjs`

**Interfaces:**
- Consumes the failing identity tests from Task 1.
- Produces package identity `dsh-whatsapp-connector`, binary `bin/dsh-whatsapp-connector.mjs`, Cordis ID `dsh-whatsapp-connector`, client loader ID `dsh-whatsapp-connector`, host name `dsh-whatsapp-connector-host`, and `hasLegacyData(dshHome): Promise<boolean>`.

- [ ] **Step 1: Implement path-only legacy detection**

Create `bin/migration.mjs`:

```js
import { access } from 'node:fs/promises';
import { join } from 'node:path';

export function legacyDataRoot(dshHome) {
  return join(dshHome, 'integrations', 'dsh-whatsapp');
}

export async function hasLegacyData(dshHome) {
  try {
    await access(legacyDataRoot(dshHome));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

export function legacyDataWarning() {
  return 'Legacy dsh-im WhatsApp data was found. Configure dsh-whatsapp-connector separately; no legacy data was changed.';
}
```

- [ ] **Step 2: Rename the package, binary, and Cordis patch**

Update `package.json` to:

```json
{
  "name": "dsh-whatsapp-connector",
  "bin": {
    "dsh-whatsapp-connector": "bin/dsh-whatsapp-connector.mjs"
  }
}
```

Update `cordis.patch.yml` to:

```yaml
- insert:
    - id: dsh-whatsapp-connector
      name: dsh-whatsapp-connector
```

Run `npm install --package-lock-only --ignore-scripts --no-audit --no-fund` to synchronize lockfile root metadata. Do not change the retained dependency versions.

- [ ] **Step 3: Rename the CLI without removing old data**

Rename the file and update its constants and usage text:

```js
const PACKAGE_NAME = 'dsh-whatsapp-connector';
const DEFAULT_SOURCE = 'github:eitaar/dsh-whatsapp-connector';
```

The CLI must invoke:

```js
runDsh(['plugin', '--profile', profile, 'add', '--save-exact', source]);
runDsh(['plugin', '--profile', profile, 'remove', PACKAGE_NAME]);
```

Do not call `runDsh(... 'remove', legacyPackage)` during installation. Before installing, call `hasLegacyData(join(process.env.DSH_HOME ?? join(homedir(), '.dsh')))` and, after a successful install, print `legacyDataWarning()` only when it returns `true`. The warning must not contain credentials or file contents.

- [ ] **Step 4: Rename client and host active identifiers**

Use these exact source values:

```js
// plugin-src/client/build.mjs
const loaderId = process.env.DSH_WHATSAPP_CONNECTOR_CLIENT_ID ?? 'dsh-whatsapp-connector';

// plugin-src/client/index.js
export const name = 'dsh-whatsapp-connector-settings';
export const IM_PLUGIN_VERSION = manifest.version;
// settings.section registration
id: 'dsh-whatsapp-connector'

// plugin-src/host/index.mjs
export const name = 'dsh-whatsapp-connector-host';
setImHostLanguage(config.language ?? process.env.DSH_WHATSAPP_CONNECTOR_LANGUAGE);
logger.error?.(`[dsh-whatsapp-connector] failed to activate ${channel}`, error);
throw new AggregateError(failures, 'dsh-whatsapp-connector failed to activate every channel');
```

Update visible branding, GitHub link, aria label, locale namespace, `style.dataset.plugin`, and style IDs to `dsh-whatsapp-connector`. Keep generic `IM` concepts where they describe the settings category, but do not leave the old identity in active loader/registration strings.

- [ ] **Step 5: Rename WhatsApp storage and logger identity**

In `plugin-src/host/channels/whatsapp/production.mjs`, use:

```js
const root = resolve(config.dataDir ?? join(dshHome, 'integrations', 'dsh-whatsapp-connector'));
const logger = typeof ctx.logger === 'function'
  ? ctx.logger('dsh-whatsapp-connector:whatsapp')
  : (ctx.logger ?? console);
```

Update active `dsh-im` logger/tool/artifact strings in retained `src/` and `plugin-src/` files to `dsh-whatsapp-connector`, without changing behavior or public error codes. Keep the historical old name only in `bin/migration.mjs`, attribution notices, and migration documentation.

- [ ] **Step 6: Run identity and migration tests**

Run: `node --test test/whatsapp-only.test.mjs --test-name-pattern='active package|active runtime|renamed CLI|legacy data'`

Expected: PASS.

- [ ] **Step 7: Commit the identity rename**

```bash
git add package.json package-lock.json cordis.patch.yml bin plugin-src src test/whatsapp-only.test.mjs
git commit -m "refactor: rename plugin to dsh-whatsapp-connector"
```

### Task 3: Rebuild artifacts and enforce new identity in verification

**Files:**
- Modify: `lib/client.js`, `lib/index.js` (generated)
- Modify: `scripts/verify-package.mjs`
- Modify: `test/whatsapp-only.test.mjs`

**Interfaces:**
- Consumes the renamed source entry points and package manifest.
- Produces generated bundles containing `dsh-whatsapp-connector`, exactly one WhatsApp registration, no active `dsh-im` identity, and a verifier that checks those invariants.

- [ ] **Step 1: Add failing generated-bundle assertions**

Append:

```js
test('generated bundles contain the new identity only', async () => {
  const host = await read('lib/index.js');
  const client = await read('lib/client.js');
  assert.match(host, /dsh-whatsapp-connector/);
  assert.match(client, /dsh-whatsapp-connector/);
  assert.doesNotMatch(host, /xmanrui-dsh-im|@xmanrui\/dsh-im/);
  assert.doesNotMatch(client, /xmanrui-dsh-im|@xmanrui\/dsh-im/);
  assert.doesNotMatch(host, /dsh-im-host|dsh-im failed|DSH_IM_LANGUAGE/);
  assert.doesNotMatch(client, /dsh-im-settings|DSH_IM_CLIENT_ID/);
});

test('verifier requires the renamed active identity', async () => {
  const verifier = await read('scripts/verify-package.mjs');
  assert.match(verifier, /dsh-whatsapp-connector/);
  assert.doesNotMatch(verifier, /name: '@xmanrui\\/dsh-im'/);
});
```

- [ ] **Step 2: Run the bundle tests before rebuilding**

Run: `node --test test/whatsapp-only.test.mjs --test-name-pattern='generated bundles|verifier requires'`

Expected: FAIL because `lib/client.js` and `lib/index.js` still contain the inherited loader, plugin, style, and logger identifiers.

- [ ] **Step 3: Update the package verifier**

Change required paths to `bin/dsh-whatsapp-connector.mjs`, require package name `dsh-whatsapp-connector`, require Cordis ID/name `dsh-whatsapp-connector`, reject active `@xmanrui/dsh-im`, `xmanrui-dsh-im`, `dsh-im-host`, `DSH_IM_CLIENT_ID`, and `DSH_IM_LANGUAGE`, and retain the existing checks for WhatsApp-only registration, license files, bundle dependencies, executable mode, and forbidden runtime artifacts. Permit the old name only in `NOTICE.md`, `THIRD_PARTY_NOTICES.md`, and explicit migration source/documentation.

- [ ] **Step 4: Rebuild both bundles**

Run:

```bash
npm run build
```

Expected: `lib/client.js` and `lib/index.js` are regenerated from renamed source and contain the new identity.

- [ ] **Step 5: Run bundle and verifier tests**

Run:

```bash
node --test test/whatsapp-only.test.mjs --test-name-pattern='generated bundles|verifier requires'
node scripts/verify-package.mjs
```

Expected: all focused tests pass and verifier prints `Verified dsh-whatsapp-connector package artifacts.`.

- [ ] **Step 6: Commit generated artifacts and verifier**

```bash
git add lib/client.js lib/index.js scripts/verify-package.mjs test/whatsapp-only.test.mjs
git commit -m "build: regenerate renamed connector artifacts"
```

### Task 4: Update documentation, notices, and package-facing migration guidance

**Files:**
- Modify: `README.md`, `README.en.md`, `NOTICE.md`, `THIRD_PARTY_NOTICES.md`
- Modify: `test/whatsapp-only.test.mjs`

**Interfaces:**
- Consumes the new CLI/package/storage identity and retained license files.
- Produces user-facing installation instructions for `dsh-whatsapp-connector`, explicit non-destructive legacy guidance, and attribution that distinguishes historical upstream origin from active identity.

- [ ] **Step 1: Add failing documentation assertions**

Append:

```js
test('documentation installs and names the new plugin', async () => {
  for (const path of ['README.md', 'README.en.md']) {
    const source = await read(path);
    assert.match(source, /dsh-whatsapp-connector/);
    assert.match(source, /github:eitaar\/dsh-whatsapp-connector/);
    assert.doesNotMatch(source, /@xmanrui\/dsh-im install|dsh-im install/);
  }
  const notice = await read('NOTICE.md');
  assert.match(notice, /historical|upstream/i);
  assert.match(notice, /@xmanrui\/dsh-im/);
});
```

- [ ] **Step 2: Run the documentation test and verify the expected red state**

Run: `node --test test/whatsapp-only.test.mjs --test-name-pattern='documentation installs'`

Expected: FAIL because the current README commands and package-facing prose still use the inherited package/CLI identity.

- [ ] **Step 3: Update installation and migration docs**

Use these commands in both READMEs:

```bash
npx -y github:eitaar/dsh-whatsapp-connector install
# or, from a checkout:
node bin/dsh-whatsapp-connector.mjs install --source .
```

Document the new package/CLI/plugin identity and storage root. State that an existing `~/.dsh/integrations/dsh-whatsapp/` directory is detected but never copied, deleted, or overwritten automatically. Keep the old package name only in the upstream-origin attribution and migration warning.

- [ ] **Step 4: Update notices without removing required upstream attribution**

Keep the existing MIT, Baileys, libsignal, protobufjs, qrcode, React, sharp, and libvips license coverage. Change active package references to `dsh-whatsapp-connector`; retain one explicit sentence identifying `@xmanrui/dsh-im` as the historical upstream source and `LICENSE` as the preserved upstream MIT text.

- [ ] **Step 5: Run documentation tests**

Run: `node --test test/whatsapp-only.test.mjs --test-name-pattern='documentation installs'`

Expected: PASS.

- [ ] **Step 6: Commit documentation and notices**

```bash
git add README.md README.en.md NOTICE.md THIRD_PARTY_NOTICES.md test/whatsapp-only.test.mjs
git commit -m "docs: publish renamed WhatsApp connector identity"
```

### Task 5: Full verification, review, and update the existing PR

**Files:**
- All retained source, generated bundles, package metadata, docs, and tests

- [ ] **Step 1: Run the full verification gate**

Run:

```bash
npm run check
npm test
npm pack --dry-run
node scripts/verify-package.mjs
git diff --check origin/main...HEAD
```

Expected: build succeeds; all tests pass; verifier prints `Verified dsh-whatsapp-connector package artifacts.`; the dry-run package is named `dsh-whatsapp-connector`; the tarball contains `bin/dsh-whatsapp-connector.mjs`, license files, no `node_modules`, no credentials, no auth state, and no runtime state; diff check is clean.

- [ ] **Step 2: Audit active old-name references**

Run:

```bash
git grep -n -E 'dsh-im|xmanrui-dsh-im|@xmanrui/dsh-im|DSH_IM_' -- ':!docs/superpowers/**' ':!THIRD_PARTY_NOTICES.md' ':!NOTICE.md' ':!bin/migration.mjs'
```

Expected: no hits in active package, CLI, source, generated bundles, tests, or verifier. Any intentional historical/migration references must remain only in the excluded paths and be explained in documentation.

- [ ] **Step 3: Review the complete diff**

Confirm that WhatsApp stream code still uses the existing `Processing…` placeholder, `5_000` ms interval, native mentions, overflow delivery, and loop protection; confirm the live `/home/ubuntu/.dsh` tree was not touched.

- [ ] **Step 4: Commit any final generated or whitespace changes**

```bash
git status --short
git diff --check
git add -A
git commit -m "chore: finalize dsh-whatsapp-connector rename"
```

Run `npm run check` again after this commit if any tracked source or generated file changed.

- [ ] **Step 5: Push the existing PR branch**

```bash
git push origin refactor/whatsapp-only
```

Expected: the existing PR branch updates without force-pushing and without modifying the live installation.

- [ ] **Step 6: Verify the PR**

```bash
gh pr view 1 --repo eitaar/dsh-whatsapp-connector --json number,title,state,url,headRefName,baseRefName
```

Expected: PR `#1` is open from `refactor/whatsapp-only` into `main`, with the full rename commits visible.
