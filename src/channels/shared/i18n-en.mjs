// English translations for host-side user-facing text.
// Keys are the exact Chinese literals passed to t() in src/channels/**.
// Chinese output is the identity default and needs no entries here.
// Entries are maintained per area in ./i18n-en/*.mjs and merged here.

import sharedA from './i18n-en/shared-a.mjs';
import sharedB from './i18n-en/shared-b.mjs';
import sharedC from './i18n-en/shared-c.mjs';
import whatsapp from './i18n-en/whatsapp.mjs';

export const EN = Object.freeze(Object.assign(
  {},
  sharedA,
  sharedB,
  sharedC,
  whatsapp,
));
