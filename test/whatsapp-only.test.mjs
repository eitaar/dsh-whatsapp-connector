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
