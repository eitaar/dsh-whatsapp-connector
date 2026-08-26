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

test('documentation describes WhatsApp only', async () => {
  const readme = await read('README.en.md');
  assert.match(readme, /WhatsApp/);
  for (const channel of removed) assert.doesNotMatch(readme, new RegExp(`\\| ${channel} \\|`, 'i'));
});

test('bundle patch retains DSH compatibility identity', async () => {
  const patch = await read('cordis.patch.yml');
  assert.match(patch, /name: '@xmanrui\/dsh-im'/);
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
