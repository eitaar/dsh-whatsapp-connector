import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

test('documentation describes WhatsApp only', async () => {
  const readme = await read('README.en.md');
  assert.match(readme, /WhatsApp/);
  for (const channel of removed) assert.doesNotMatch(readme, new RegExp(`\\| ${channel} \\|`, 'i'));
});

test('documentation installs and names the new plugin', async () => {
  const expectations = {
    'README.md': {
      separateConfiguration: /请单独配置新的连接器/,
      legacyChoice: /保留、停用或移除旧安装/,
      nonDestructive: /不会自动复制、删除或覆盖/,
    },
    'README.en.md': {
      separateConfiguration: /configure the new connector separately/i,
      legacyChoice: /choose whether to keep, disable, or remove the old installation/i,
      nonDestructive: /never copies, deletes, or overwrites/i,
    },
  };

  for (const [path, expected] of Object.entries(expectations)) {
    const source = await read(path);
    assert.match(source, /dsh-whatsapp-connector/);
    assert.match(source, /npx -y github:eitaar[/]dsh-whatsapp-connector install/);
    assert.match(source, /node bin[/]dsh-whatsapp-connector\.mjs install --source \./);
    assert.match(source, /~[/]\.dsh[/]integrations[/]dsh-whatsapp-connector[/]/);
    assert.match(source, expected.nonDestructive);
    assert.match(source, expected.separateConfiguration);
    assert.match(source, expected.legacyChoice);
    assert.doesNotMatch(source, /@xmanrui[/]dsh-im install|dsh-im install/);
    assert.doesNotMatch(source, /alt=[\"'][^\"']*DSH-IM[^\"']*[\"']/i);
  }
  const notice = await read('NOTICE.md');
  assert.match(notice, /historical|upstream/i);
  assert.match(notice, /@xmanrui[/]dsh-im/);
});

test('bundle patch retains DSH compatibility identity', async () => {
  const patch = await read('cordis.patch.yml');
  assert.match(patch, /name: dsh-whatsapp-connector/);
});

test('third-party notices identify retained packages and copyleft assets', async () => {
  const notices = await read('THIRD_PARTY_NOTICES.md');
  for (const packageName of ['@whiskeysockets/baileys', 'qrcode', 'esbuild', 'react', 'react-dom', 'react-test-renderer', 'protobufjs', 'libsignal', 'sharp', '@img/sharp-libvips']) {
    assert.match(notices, new RegExp(packageName.replaceAll('/', '\\/'), 'i'), packageName);
  }
  assert.match(notices, /GPL-3\.0/);
  assert.match(notices, /LGPL-3\.0-or-later/);
  assert.match(notices, /Facebook, Inc\. and its affiliates/);
  assert.match(notices, /Rajeh Taher\/WhiskeySockets/);
});

test('shared locale aggregate and CSS contain only retained identifiers', async () => {
  const [aggregate, styles, localeFiles] = await Promise.all([
    read('src/channels/shared/i18n-en.mjs'),
    read('plugin-src/client/styles.js'),
    readdir(new URL('src/channels/shared/i18n-en/', root)),
  ]);
  for (const channel of [...removed, 'bxf', 'dxw', 'ddt', 'dqq', 'dwecom', 'dsl', 'dwa']) {
    assert.doesNotMatch(aggregate, new RegExp(channel, 'i'));
    assert.doesNotMatch(styles, new RegExp(channel, 'i'));
  }
  assert.deepEqual(localeFiles.sort(), ['shared-a.mjs', 'shared-b.mjs', 'shared-c.mjs', 'whatsapp.mjs']);
});

test('retained English locale translates WhatsApp scan cancellation', async () => {
  const locale = await read('src/channels/shared/i18n-en/whatsapp.mjs');
  assert.match(locale, /'扫码接入已取消。': 'The QR code connection was cancelled\.'/);
});

test('artifact permission messaging has no removed channel branches', async () => {
  const source = await read('src/channels/shared/text-harness-bridge.mjs');
  assert.match(source, /artifact-permission-required/);
  for (const channel of ['slack', 'discord', 'telegram']) {
    assert.doesNotMatch(source, new RegExp(`descriptor\\?\\.key\\s*===\\s*['"]${channel}['"]`));
  }
});

test('package ships exact retained component licenses', async () => {
  const manifest = JSON.parse(await read('package.json'));
  assert.ok(manifest.files.includes('licenses'));
  const licenseFiles = {
    'baileys-MIT.txt': 'node_modules/@whiskeysockets/baileys/LICENSE',
    'libsignal-GPL-3.0.txt': 'node_modules/libsignal/LICENSE',
    'protobufjs-BSD-3-Clause.txt': 'node_modules/protobufjs/LICENSE',
    'sharp-Apache-2.0.txt': 'node_modules/sharp/LICENSE',
    'sharp-libvips-LGPL-3.0-or-later.txt': '/usr/share/common-licenses/LGPL-3',
  };
  for (const [name, sourcePath] of Object.entries(licenseFiles)) {
    assert.equal(await read(`licenses/${name}`), await read(sourcePath), name);
  }
});

test('package verifier checks retained licenses and runtime artifacts', async () => {
  const source = await read('scripts/verify-package.mjs');
  assert.match(source, /licenses\/baileys-MIT\.txt/);
  assert.match(source, /node_modules|auth|credentials|runtime state/);
  assert.match(source, /removed channel/);
});

test('retained client metadata names WhatsApp only', async () => {
  const [locale, styles] = await Promise.all([
    read('plugin-src/client/i18n.js'),
    read('plugin-src/client/styles.js'),
  ]);
  assert.match(locale, /'IM 渠道': 'IM channels'/);
  for (const stale of [
    'Feishu', '飞书', 'DingTalk', '钉钉', 'WeCom', '企业微信',
    'WeChat', '微信', 'QQ', 'AI Office', 'Office',
  ]) assert.doesNotMatch(locale, new RegExp(stale), `locale contains ${stale}`);
  for (const selector of ['dim-logoWeixin', 'dim-logoFeishu', 'dim-logoDingtalk', 'dim-logoQq', 'dim-logoWecom', 'dim-logoTelegram', 'dim-logoOffice', 'dim-logoDiscord', 'dim-logoSlack']) {
    assert.doesNotMatch(styles, new RegExp(`\\.${selector}\\\\b`), `styles contain ${selector}`);
  }
});

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

  const activeSources = await Promise.all([
    read('package.json'),
    read('package-lock.json'),
    read('cordis.patch.yml'),
    read('plugin-src/client/build.mjs'),
    read('plugin-src/client/index.js'),
    read('plugin-src/host/index.mjs'),
  ]);
  for (const source of activeSources) {
    for (const marker of ['@xmanrui/dsh-im', 'xmanrui-dsh-im', 'dsh-im-host', 'DSH_IM_']) {
      assert.doesNotMatch(source, new RegExp(marker), marker);
    }
  }
});

test('active runtime paths use the new integration namespace', async () => {
  const productionSources = await Promise.all([
    read('plugin-src/host/channels/whatsapp/production.mjs'),
    read('plugin-src/host/channels/shared/production.mjs'),
  ]);
  assert.match(productionSources[0], /integrations', 'dsh-whatsapp-connector'/);
  assert.doesNotMatch(productionSources[0], /integrations', 'dsh-whatsapp'/);
  assert.doesNotMatch(productionSources[1], /integrations', 'dsh-whatsapp'/);

  const { pluginPaths } = await import('../plugin-src/host/channels/shared/production.mjs');
  const paths = pluginPaths({ dshHome: '/tmp/dsh-whatsapp-connector-test' }, 'whatsapp');
  assert.match(paths.config, /integrations\/dsh-whatsapp-connector\/config\.json$/);
});

test('renamed CLI is published and inherited CLI is absent', async () => {
  await access(new URL('../bin/dsh-whatsapp-connector.mjs', import.meta.url));
  await assert.rejects(
    access(new URL('../bin/dsh-im.mjs', import.meta.url)),
    { code: 'ENOENT' },
  );
});

test('legacy data detection is path-only and non-destructive', async () => {
  const { hasLegacyData } = await import('../bin/migration.mjs');
  const dshHome = await mkdtemp(join(tmpdir(), 'dsh-whatsapp-rename-'));
  const legacyRoot = join(dshHome, 'integrations', 'dsh-whatsapp');
  const marker = join(legacyRoot, 'state.json');
  try {
    assert.equal(await hasLegacyData(dshHome), false);
    await mkdir(legacyRoot, { recursive: true });
    assert.equal(await hasLegacyData(dshHome), true);
    await writeFile(marker, 'sentinel', 'utf8');
    assert.equal(await hasLegacyData(dshHome), true);
    assert.equal(await readFile(marker, 'utf8'), 'sentinel');
  } finally {
    await rm(dshHome, { recursive: true, force: true });
  }
});

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

test('verifier covers CLI, runtime, lock root, and inherited markers', async () => {
  const verifier = await read('scripts/verify-package.mjs');
  const normalized = verifier.replaceAll('\\/', '/');
  assert.match(verifier, /readFile\(resolve\(root, 'bin\/dsh-whatsapp-connector\.mjs'\), 'utf8'\)/);
  assert.match(verifier, /readSourceTree\(resolve\(root, 'src'\)\)/);
  assert.match(verifier, /lock\.packages\?\.\[''\]\?\.name/);
  assert.match(verifier, /const forbiddenInheritedIdentities = \[/);
  for (const marker of [
    '@xmanrui/dsh-im', 'xmanrui-dsh-im', 'dsh-im-host', 'dsh-im-settings',
    'DSH_IM_CLIENT_ID', 'DSH_IM_LANGUAGE',
  ]) assert.ok(normalized.includes(marker), `forbidden marker is covered: ${marker}`);
  assert.doesNotMatch(verifier, /name: '@xmanrui\/dsh-im'/);
});
