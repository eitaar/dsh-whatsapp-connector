import { access } from 'node:fs/promises';
import { join } from 'node:path';

export const LEGACY_ACTIVE_IDENTITY_MARKERS = Object.freeze([
  '@xmanrui/dsh-im',
  'xmanrui-dsh-im',
  'dsh-im-host',
  'dsh-im-settings',
  'DSH_IM_CLIENT_ID',
  'DSH_IM_LANGUAGE',
]);

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
