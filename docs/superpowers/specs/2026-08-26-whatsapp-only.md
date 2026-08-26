# WhatsApp-only Connector Design

## Goal

Reduce `eitaar/dsh-whatsapp-connector` to the WhatsApp connector and the shared DeepSeek Harness infrastructure required by it, without changing the live installed DSH plugin.

## Scope

- Keep WhatsApp host/client adapters and shared Harness/session/stream modules imported by them.
- Remove non-WhatsApp channel source, client tabs, styles, logos, assets, and dependency declarations.
- Register only WhatsApp in the host and settings client.
- Preserve the internal `@xmanrui/dsh-im` / `xmanrui-dsh-im` identity because DSH bundle registration relies on it.
- Keep the repository itself at `eitaar/dsh-whatsapp-connector`.
- Preserve the upstream MIT license, add attribution for `eitaar` changes, and retain notices only for dependencies/adaptations still present.
- Do not modify the currently running installed plugin under `/home/ubuntu/.dsh`.

## Required behavior

- WhatsApp replies use the existing native edit stream with an English `Processing…` placeholder and a 5,000 ms update interval.
- Native `@@sender` mentions work in the edited message and overflow messages.
- DSH host/client bundles build successfully and load only WhatsApp channel registration.
- Package verification proves no removed channel registrations or dependencies remain.
