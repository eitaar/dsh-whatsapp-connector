import * as React from 'react';
import manifest from '../../package.json' with { type: 'json' };

import { WhatsappLogoGlyph } from './channel-logos.js';
import { WHATSAPP_RPC_CHANNEL } from './channels/whatsapp/api.js';
import { WhatsappSettingsTab } from './channels/whatsapp/index.js';
import { installWhatsappStyles } from './channels/whatsapp/styles.js';
import { en, h, IM_LOCALE_NAMESPACE, setImTranslator, zh } from './i18n.js';
import {
  createLoopbackAwareRpcCalls,
  replacePageLocation,
} from './loopback-recovery.js';
import { installImStyles } from './styles.js';
import { WorkspaceDirectoryPickerContext } from './workspace-editor.js';

export const name = 'dsh-whatsapp-connector-settings';
export const inject = ['slots', 'connection', 'locale', 'workspaces'];
export const IM_PLUGIN_VERSION = manifest.version;

const CHANNELS = Object.freeze([
  { id: 'whatsapp', label: 'WhatsApp' },
]);

function ChannelLogo() {
  return h('span', { className: 'dim-logo dim-logoWhatsapp', 'aria-hidden': 'true' },
    h(WhatsappLogoGlyph));
}

export function LoopbackRecoveryNotice({ recovery, onNavigate = replacePageLocation }) {
  return h('div', {
    className: 'dim-loopbackRecovery',
    role: 'alert',
  },
  h('div', { className: 'dim-loopbackRecoveryCopy' },
    h('strong', null, '请改用 localhost 重新打开'),
    h('p', null, '页面会在当前端口重新打开，机器人配置不会改变。'),
    h('code', null, recovery.origin)),
  h('button', {
    type: 'button',
    className: 'dim-loopbackRecoveryAction',
    onClick: () => onNavigate(recovery.url),
  }, '使用 localhost 重新打开'));
}

export function IMSettingsTab({
  whatsappRpcCall,
  workspaceDirectoryPicker,
  browserLocation = globalThis.location,
  navigateToRecoveryUrl = replacePageLocation,
}) {
  const [selected, setSelected] = React.useState('whatsapp');
  const [loopbackRecovery, setLoopbackRecovery] = React.useState(null);
  const versionTooltipId = React.useId();
  const githubTooltipId = React.useId();
  const active = CHANNELS.find((channel) => channel.id === selected) ?? CHANNELS[0];
  const reportLoopbackRecovery = React.useCallback((recovery) => {
    setLoopbackRecovery((current) => current?.url === recovery.url ? current : recovery);
  }, []);
  const rpcCalls = React.useMemo(() => createLoopbackAwareRpcCalls({
    whatsappRpcCall,
  }, {
    location: browserLocation,
    onRecovery: reportLoopbackRecovery,
  }), [browserLocation, reportLoopbackRecovery, whatsappRpcCall]);
  return h(WorkspaceDirectoryPickerContext.Provider, { value: workspaceDirectoryPicker },
    h('section', { className: 'dim-page', 'aria-label': 'IM机器人设置' },
    h('header', { className: 'dim-title' },
      h('div', {
        className: 'dim-brand',
        tabIndex: 0,
        'aria-describedby': versionTooltipId,
      },
        h('strong', { className: 'dim-brandName' }, 'DSH WhatsApp Connector'),
        h('p', null, '让 DeepSeek Harness 触手可及'),
        h('span', {
          id: versionTooltipId,
          className: 'dim-versionTooltip',
          role: 'tooltip',
        },
        h('span', null, '当前版本'),
        h('strong', null, `v${IM_PLUGIN_VERSION}`))),
      h('span', { className: 'dim-githubAction' },
        h('a', {
          className: 'dim-githubLink',
          href: 'https://github.com/xmanrui/dsh-whatsapp-connector',
          target: '_blank',
          rel: 'noopener noreferrer',
          'aria-label': 'dsh-whatsapp-connector GitHub',
          'aria-describedby': githubTooltipId,
        },
        h('span', null, 'GitHub'),
        h('span', { className: 'dim-githubArrow', 'aria-hidden': 'true' }, '↗')),
        h('span', {
          id: githubTooltipId,
          className: 'dim-githubTooltip',
          role: 'tooltip',
        }, '帮助与反馈 · 前往 GitHub')),
    ),
    h('div', { className: 'dim-layout' },
      h('nav', { className: 'dim-rail', role: 'tablist', 'aria-label': 'IM 渠道' },
        CHANNELS.map((channel) => h('button', {
          key: channel.id,
          type: 'button',
          role: 'tab',
          id: `dim-tab-${channel.id}`,
          className: 'dim-channel',
          'aria-selected': channel.id === active.id,
          'aria-controls': `dim-panel-${channel.id}`,
          onClick: () => setSelected(channel.id),
        },
        h(ChannelLogo, { channel: channel.id }),
        h('span', { className: 'dim-channelCopy' },
          h('strong', null, channel.label),
          channel.note ? h('small', { className: 'dim-channelNote' }, channel.note) : null,
        )))),
      h('div', { className: 'dim-divider', 'aria-hidden': 'true' }),
      h('main', {
        className: 'dim-panel',
        role: 'tabpanel',
        id: `dim-panel-${active.id}`,
        'aria-labelledby': `dim-tab-${active.id}`,
      },
      loopbackRecovery
        ? h(LoopbackRecoveryNotice, {
            recovery: loopbackRecovery,
            onNavigate: navigateToRecoveryUrl,
          })
        : null,
      h(WhatsappSettingsTab, { rpcCall: rpcCalls.whatsappRpcCall }),
    ),
  )));
}

export function apply(ctx) {
  ctx.effect(
    () => ctx.locale.register(IM_LOCALE_NAMESPACE, { zh, en }),
    'im-settings: bilingual dictionaries',
  );
  const t = ctx.locale.bind(IM_LOCALE_NAMESPACE);
  setImTranslator(t);

  ctx.effect(() => {
    const disposers = [
      installWhatsappStyles(),
      installImStyles(),
    ];
    return () => {
      for (const dispose of disposers.reverse()) dispose();
    };
  }, 'im-settings: install combined channel styles');

  const whatsappRpcCall = (endpoint, payload, signal) =>
    ctx.connection.rpc.call(WHATSAPP_RPC_CHANNEL, endpoint, payload, signal);
  const workspaceDirectoryPicker = Object.freeze({
    listDirectory: (path, signal) => ctx.workspaces.listDirectory(path, signal),
    pickDirectory: () => ctx.workspaces.pickDirectory(),
  });

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'dsh-whatsapp-connector',
    order: 21,
    label: () => t('IM机器人'),
    locale: IM_LOCALE_NAMESPACE,
    inject: () => ({
      whatsappRpcCall,
      workspaceDirectoryPicker,
    }),
  }, IMSettingsTab));
}
