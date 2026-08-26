import { apply as applyWhatsapp } from './channels/whatsapp/index.mjs';
import { installOutboundArtifactTool } from '../../src/channels/shared/semantic/artifact.mjs';
import { setImHostLanguage } from '../../src/channels/shared/i18n.mjs';

export const name = 'dsh-im-host';
export const inject = [
  'connection',
  'credentials',
  'webServer',
  'typertGateway',
];

function channelConfig(config, name) {
  const channel = config[name] ?? {};
  return config.rpcAuthority === undefined
    ? channel
    : { ...channel, rpcAuthority: config.rpcAuthority };
}

export function createImHostPlugin(internals = {}) {
  const startWhatsapp = internals.applyWhatsapp ?? applyWhatsapp;
  const channels = [['whatsapp', startWhatsapp]];
  return Object.freeze({
    name,
    inject,
    async apply(ctx, config = {}) {
      setImHostLanguage(config.language ?? process.env.DSH_IM_LANGUAGE);
      if (typeof ctx?.inject === 'function') {
        ctx.inject(['tools', 'systemPrompt'], (artifactCtx) => {
          installOutboundArtifactTool(artifactCtx);
        });
      } else {
        installOutboundArtifactTool(ctx);
      }
      const logger = typeof ctx?.logger === 'function'
        ? ctx.logger(name)
        : (ctx?.logger ?? console);
      const failures = [];
      for (const [channel, start] of channels) {
        try {
          await start(ctx, channelConfig(config, channel));
        } catch (error) {
          failures.push(error);
          logger.error?.(`[dsh-im] failed to activate ${channel}; continuing with the remaining channels`, error);
        }
      }
      if (failures.length === channels.length) {
        throw new AggregateError(failures, 'dsh-im failed to activate every channel');
      }
    },
  });
}

export async function apply(ctx, config = {}) {
  return createImHostPlugin().apply(ctx, config);
}
