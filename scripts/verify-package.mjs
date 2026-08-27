import { access, readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { LEGACY_ACTIVE_IDENTITY_MARKERS } from '../bin/migration.mjs';

const root = resolve(import.meta.dirname, '..');

async function readSourceTree(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const chunks = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      chunks.push(await readSourceTree(path));
    } else if (entry.isFile() && /\.m?js$/u.test(entry.name)) {
      chunks.push(await readFile(path, 'utf8'));
    }
  }
  return chunks.join('\n');
}

const required = [
  'lib/index.js',
  'lib/client.js',
  'bin/dsh-whatsapp-connector.mjs',
  'cordis.patch.yml',
  'README.md',
  'THIRD_PARTY_NOTICES.md',
  'licenses/baileys-MIT.txt',
  'licenses/libsignal-GPL-3.0.txt',
  'licenses/protobufjs-BSD-3-Clause.txt',
  'licenses/sharp-Apache-2.0.txt',
  'licenses/sharp-libvips-LGPL-3.0-or-later.txt',
  'licenses/qrcode-MIT.txt',
  'licenses/esbuild-MIT.txt',
  'licenses/react-MIT.txt',
  'licenses/react-dom-MIT.txt',
  'licenses/react-test-renderer-MIT.txt',
  'plugin-src/client/i18n.js',
  'plugin-src/client/channels/whatsapp/index.js',
  'plugin-src/client/channels/whatsapp/styles.js',
  'plugin-src/host/channels/whatsapp/index.mjs',
  'src/channels/whatsapp/whatsapp-runtime.mjs',
  'src/channels/whatsapp/whatsapp-web-session.mjs',
];
const removedChannels = ['dingtalk', 'discord', 'feishu', 'office', 'qq', 'slack', 'telegram', 'wecom', 'weixin'];
const channelRootEntries = await readdir(resolve(root, 'src/channels'), { withFileTypes: true });
for (const name of removedChannels) {
  if (channelRootEntries.some((entry) => entry.isDirectory() && entry.name === name)) {
    throw new Error(`non-WhatsApp source channel remains: src/channels/${name}`);
  }
}
await Promise.all(required.map((path) => access(resolve(root, path))));

const [
  client,
  host,
  patch,
  manifestText,
  lockText,
  hostSource,
  clientEntrySource,
  clientSources,
  hostSources,
  cli,
  runtimeSources,
  executable,
] = await Promise.all([
  readFile(resolve(root, 'lib/client.js'), 'utf8'),
  readFile(resolve(root, 'lib/index.js'), 'utf8'),
  readFile(resolve(root, 'cordis.patch.yml'), 'utf8'),
  readFile(resolve(root, 'package.json'), 'utf8'),
  readFile(resolve(root, 'package-lock.json'), 'utf8'),
  readFile(resolve(root, 'plugin-src/host/index.mjs'), 'utf8'),
  readFile(resolve(root, 'plugin-src/client/index.js'), 'utf8'),
  readSourceTree(resolve(root, 'plugin-src/client')),
  readSourceTree(resolve(root, 'plugin-src/host')),
  readFile(resolve(root, 'bin/dsh-whatsapp-connector.mjs'), 'utf8'),
  readSourceTree(resolve(root, 'src')),
  stat(resolve(root, 'bin/dsh-whatsapp-connector.mjs')),
]);
const manifest = JSON.parse(manifestText);
const lock = JSON.parse(lockText);

if (manifest.name !== 'dsh-whatsapp-connector') {
  throw new Error('package manifest must use the dsh-whatsapp-connector package name');
}
if (lock.name !== 'dsh-whatsapp-connector' || lock.packages?.['']?.name !== 'dsh-whatsapp-connector') {
  throw new Error('package lock must use the dsh-whatsapp-connector package name at the root');
}
if (JSON.stringify(manifest.bin) !== JSON.stringify({
  'dsh-whatsapp-connector': 'bin/dsh-whatsapp-connector.mjs',
})) {
  throw new Error('package manifest must publish only the dsh-whatsapp-connector executable');
}
if (!/\bid\s*:\s*(?:["']dsh-whatsapp-connector["']|dsh-whatsapp-connector)\b/u.test(patch)
  || !/\bname\s*:\s*(?:["']dsh-whatsapp-connector["']|dsh-whatsapp-connector)\b/u.test(patch)) {
  throw new Error('Cordis patch must activate dsh-whatsapp-connector with matching id and name');
}
if (!/window\.__ModuleLoader__\.load\(\{\s*id:\s*["']dsh-whatsapp-connector["']/u.test(client)) {
  throw new Error('client bundle must use the dsh-whatsapp-connector loader identity');
}
if (!client.includes('dsh-whatsapp-connector-settings')
  || !clientEntrySource.includes('dsh-whatsapp-connector-settings')) {
  throw new Error('client bundle and source must use the dsh-whatsapp-connector settings identity');
}

const activeIdentityText = [
  manifestText,
  lockText,
  patch,
  hostSource,
  clientEntrySource,
  clientSources,
  hostSources,
  cli,
  runtimeSources,
  client,
  host,
].join('\n');
for (const marker of LEGACY_ACTIVE_IDENTITY_MARKERS) {
  if (activeIdentityText.includes(marker)) {
    throw new Error(`active inherited identity remains: ${marker}`);
  }
}

// DSH runtime packages use module-local Symbol keys, so a second physical copy breaks Host lookup.
const forbiddenDshDependency = /^@deepseek-ai\/dsh-/;
const dependencySections = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];
for (const section of dependencySections) {
  for (const name of Object.keys(manifest[section] ?? {})) {
    if (forbiddenDshDependency.test(name)) {
      throw new Error(
        `${name} must not be declared in ${section}; DSH runtime packages must come from the host`,
      );
    }
  }
}
const bundledDependencies = manifest.bundleDependencies ?? manifest.bundledDependencies ?? [];
if (Array.isArray(bundledDependencies)) {
  for (const name of bundledDependencies) {
    if (forbiddenDshDependency.test(name)) {
      throw new Error(`${name} must not be bundled; DSH runtime packages must come from the host`);
    }
  }
}
const forbiddenDshLockPaths = Object.keys(lock.packages ?? {}).filter((path) => (
  /(?:^|\/)node_modules\/@deepseek-ai\/dsh-[^/]+(?:\/|$)/.test(path)
));
if (forbiddenDshLockPaths.length > 0) {
  throw new Error(
    `package lock must not install DSH runtime packages: ${forbiddenDshLockPaths.join(', ')}`,
  );
}

if (!/\bid\s*:\s*["']dsh-whatsapp-connector["']/u.test(client)) {
  throw new Error('client bundle does not register the dsh-whatsapp-connector loader id');
}
const sourceSectionMarkers = [
  /ctx\.slots\.inject\(\s*["']settings\.section["']/u,
  /name\s*:\s*["']settings\.section["']/u,
  /id\s*:\s*["']dsh-whatsapp-connector["']/u,
  /order\s*:\s*21\b/u,
  /label\s*:\s*\(\)\s*=>\s*t\(\s*["']IM机器人["']\s*\)/u,
  /locale\s*:\s*IM_LOCALE_NAMESPACE\b/u,
];
const bundleSectionPattern = /name\s*:\s*["']settings\.section["']\s*,\s*id\s*:\s*["']dsh-whatsapp-connector["']\s*,\s*order\s*:\s*21\s*,\s*label\s*:\s*\(\)\s*=>\s*[$A-Z_a-z][$\w]*\(\s*["']IM(?:机器人|\\u673A\\u5668\\u4EBA)["']\s*\)\s*,\s*locale\s*:\s*(?:[$A-Z_a-z][$\w]*|["']dsh-whatsapp-connector["'])/u;
if (sourceSectionMarkers.some((pattern) => !pattern.test(clientEntrySource))
  || !/IM_LOCALE_NAMESPACE\s*=\s*["']dsh-whatsapp-connector["']/u.test(clientSources)
  || !bundleSectionPattern.test(client)) {
  throw new Error('client bundle does not register the localized top-level IM settings section');
}
if ((client.match(/\.slots\.inject\(\s*["']settings\.section["']/gu) ?? []).length !== 1) {
  throw new Error('client bundle must register exactly one top-level settings section');
}
if (client.includes('settings.plugins.tab') || clientSources.includes('settings.plugins.tab')) {
  throw new Error('client source or bundle still contains the legacy Plugins-tab settings entry');
}
if (/role:\s*["']switch|type:\s*["']checkbox/.test(client)) {
  throw new Error('client bundle contains a channel enable switch');
}
if (!client.includes('container-type: inline-size')
  || !client.includes('@container (max-width: 680px)')) {
  throw new Error('client bundle does not contain the narrow-panel DingTalk QR layout');
}
if (!host.includes('/whatsapp')) {
  throw new Error('host bundle does not contain the internal /whatsapp RPC provider');
}
if ((host.match(/\[\[\s*["']whatsapp["']/gu) ?? []).length !== 1) {
  throw new Error('host bundle must register exactly one WhatsApp channel');
}
for (const marker of ['/session Session ID', 'bindWorkspaceSession', 'session-subagent-unsupported']) {
  if (!host.includes(marker)) {
    throw new Error(`host bundle does not contain the Session binding marker: ${marker}`);
  }
}
if (/@xmanrui\/dsh-(?:feishu|weixin|dingtalk)/.test(host)) {
  throw new Error('host bundle still imports an external channel plugin');
}
const removedImportPattern = /channels\/(?:dingtalk|discord|feishu|office|qq|slack|telegram|wecom|weixin)(?:\/|['"])/u;
if (removedImportPattern.test(hostSources) || removedImportPattern.test(clientSources)) {
  throw new Error('source still imports a removed channel');
}
const removedExecutableMarkers = [
  'applyDingtalk', 'applyDiscord', 'applyFeishu', 'applyOffice',
  'applyQq', 'applySlack', 'applyTelegram', 'applyWecom', 'applyWeixin',
  'DingtalkSettingsTab', 'DiscordSettingsTab', 'FeishuSettingsTab',
  'OfficeSettingsTab', 'QqSettingsTab', 'SlackSettingsTab',
  'TelegramSettingsTab', 'WecomSettingsTab', 'WeixinSettingsTab',
];
for (const marker of removedExecutableMarkers) {
  if (hostSource.includes(marker) || clientEntrySource.includes(marker)
    || host.includes(marker) || client.includes(marker)) {
    throw new Error(`removed channel executable marker remains: ${marker}`);
  }
}
const forbiddenRuntimeArtifactPattern = /(?:^|\/)(?:node_modules|auth|auth_info_baileys|credentials|runtime-state|runtime_state)(?:\/|$)/iu;
for (const path of manifest.files ?? []) {
  if (forbiddenRuntimeArtifactPattern.test(path)) {
    throw new Error(`forbidden runtime artifact is published: ${path}`);
  }
}
if (/@xmanrui\/dsh-(?:feishu|weixin|dingtalk)/.test(
  manifestText + lockText + hostSources + clientSources,
)) {
  throw new Error('source or package metadata still depends on an external channel plugin');
}
if (!patch.includes('name: dsh-whatsapp-connector') || /dsh-(?:feishu|weixin|dingtalk)/.test(patch)) {
  throw new Error('bundle patch must activate only dsh-whatsapp-connector');
}
for (const name of ['@xmanrui/dsh-feishu', '@xmanrui/dsh-weixin', '@xmanrui/dsh-dingtalk']) {
  if (manifest.dependencies?.[name]) {
    throw new Error(`${name} must not remain an external dependency`);
  }
}
const directDependencies = {
  qrcode: '1.5.4',
};
for (const [name, version] of Object.entries(directDependencies)) {
  if (manifest.dependencies?.[name] !== version) {
    throw new Error(`${name} must be a pinned direct dependency at ${version}`);
  }
}
for (const name of ['dingtalk-stream', '@tencent-connect/qqbot-connector', '@tencent-connect/qqbot-nodejs', '@wecom/aibot-node-sdk']) {
  if (manifest.dependencies?.[name] !== undefined) {
    throw new Error(`${name} must not remain a WhatsApp-only runtime dependency`);
  }
}
const bundledBuildDependencies = {
  '@whiskeysockets/baileys': '7.0.0-rc14',
};
for (const [name, version] of Object.entries(bundledBuildDependencies)) {
  if (manifest.dependencies?.[name] !== undefined) {
    throw new Error(`${name} must not remain a runtime dependency`);
  }
  if (manifest.devDependencies?.[name] !== version) {
    throw new Error(`${name} must be a pinned build dependency at ${version}`);
  }
}
if (lock.packages?.['node_modules/protobufjs']?.dev !== true) {
  throw new Error('protobufjs must remain build-only in the package lock');
}
if (manifest.bin?.['dsh-whatsapp-connector'] !== 'bin/dsh-whatsapp-connector.mjs') {
  throw new Error('package manifest must publish the dsh-whatsapp-connector executable');
}
if (/(?:from\s*|import\s*\(|require\s*\()\s*["'](?:@whiskeysockets\/baileys|protobufjs)(?:\/[^"']*)?["']/.test(host)) {
  throw new Error('host bundle must not import a bundled SDK or protobufjs at runtime');
}
if ((executable.mode & 0o111) === 0) throw new Error('dsh-whatsapp-connector CLI is not executable');
if (/private-bot-token|must-be-rolled-back|DEEPSEEK_API_KEY=/.test(client + host)) {
  throw new Error('built artifacts contain a test or environment secret marker');
}
await import(pathToFileURL(resolve(root, 'lib/index.js')).href);

console.log('Verified dsh-whatsapp-connector package artifacts.');
